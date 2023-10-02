import React, { useEffect, useState } from 'react';
import Metaphor from 'metaphor-node';
import cheerio from 'cheerio';

const api_key = process.env.NEXT_PUBLIC_API_KEY;
const hf_api_key = process.env.NEXT_PUBLIC_HF_API_KEY;

function formatDate(inputDate) {
    const options = { month: 'long', day: 'numeric' };
    const date = new Date(inputDate);
    const formattedDate = date.toLocaleDateString(undefined, options);
    const year = date.getFullYear();
    const day = date.getDate();
    const daySuffix = getDaySuffix(day);
    return `${formattedDate}${daySuffix}, ${year}`;
}

function formatDate_API(date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function subtractDaysFromToday(days) {
    const today = new Date();
    const subtractedDate = new Date(today);
    subtractedDate.setDate(today.getDate() - days);
    return formatDate_API(subtractedDate);
}


function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// hugging face fast reference api
async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/human-centered-summarization/financial-summarization-pegasus",
        {
            headers: { Authorization: `Bearer ${hf_api_key}` },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}

async function metaphor_query(query, date) {
    var end_date;
    switch (date) {
        case 7: end_date = 0; break;
        case 30: end_date = 7; break;
        case 90: end_date = 30; break;
        case 365: end_date = 90; break;
    }

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': api_key
        },
        body: JSON.stringify({
            query: `Recent papers in ${query}`,
            numResults: 4,
            includeDomains: ["https://arxiv.org", "https://scholar.google.com", "https://nips.cc", "https://icml.cc", "http://www.jmlr.org", "https://www.mitpressjournals.org", "https://dl.acm.org", "https://ieeexplore.ieee.org"],
            startPublishedDate: subtractDaysFromToday(date),
            endPublishedDate: subtractDaysFromToday(end_date),
            useAutoprompt: true
        })
    };
    const response = await fetch("https://api.metaphor.systems/search", options)
    const result = await response.json();
    return result;

}


const ApiButton = ({ searchQuery, dateDiff }) => {
    const [ready, setReady] = useState(false);
    const [showRelatedContent, setShowRelatedContent] = useState([false, false, false, false]);
    const [relatedContent, setRelatedContent] = useState([[], [], [], []]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState('');
    const [contents, setContents] = useState(null);
    const metaphor = new Metaphor(api_key);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (ready) {
                clearInterval(intervalId);
                return;
            }
            const response = await query({ "inputs": 'This paper introduces an approach that combines the language reasoning capabilities of large language models (LLMs) with the benefits of local training to tackle complex, domain-specific tasks. Specifically, the authors demonstrate their approach by extracting structured condition codes from pathology reports. The proposed approach utilizes local LLMs, which can be fine-tuned to respond to specific generative instructions and provide structured outputs. The authors collected a dataset of over 150k uncurated surgical pathology reports, containing gross descriptions, final diagnoses, and condition codes. They trained different model architectures, including LLaMA, BERT and LongFormer and evaluated their performance. The results show that the LLaMA-based models significantly outperform BERT-style models across all evaluated metrics, even with extremely reduced precision. The LLaMA models performed especially well with large datasets, demonstrating their ability to handle complex, multi-label tasks. Overall, this work presents an effective approach for utilizing LLMs to perform domain-specific tasks using accessible hardware, with potential applications in the medical domain, where complex data extraction and classification are required.' });
                if (response[0].hasOwnProperty('summary_text')) {
                    console.log('MODEL LAODED: :)');
                    setReady(true);
                }
        }, 10000);
        if (ready) {
            clearInterval(intervalId);
        }

        return () => clearInterval(intervalId);
    }, [ready]);

    const handleMoreLikeThisClick = async (paper, index) => {
        if (!showRelatedContent[index]) {
            try {
                const response = await metaphor.findSimilar(paper.url, {
                    numResults: 2
                });
                var temp = [...relatedContent]
                temp[index] = response.results;
                setRelatedContent(temp);
                var temp = [...showRelatedContent];
                temp[index] = !temp[index];
                setShowRelatedContent(temp);
            } catch (error) {
                console.error('Related connet error:', error);
            }
        } else {
            var temp = [...showRelatedContent];
            temp[index] = !temp[index];
            setShowRelatedContent(temp);
        }
    };

    const handleApiCall = async () => {
        console.log('Running Handle Call');
        setIsLoading(true);
        try {
            /*
            const response = await metaphor.search(`Recent papers in ${searchQuery}`, {
                numResults: 2,
                includeDomains: ["https://arxiv.org", "https://scholar.google.com", "https://nips.cc", "https://icml.cc", "http://www.jmlr.org", "https://www.mitpressjournals.org", "https://dl.acm.org", "https://ieeexplore.ieee.org"],
                startPublishedDate: "2023-05-10",
                useAutoprompt: true,
            });
*/
            console.log('Calling the API');
            const response = await metaphor_query(searchQuery, dateDiff);
            setApiResponse(response);

            const paperIds = response.results.map((paper) => paper.id);
            const responsesArray = await metaphor.getContents(paperIds);
            const extracts = responsesArray.contents.map(async (x) => {
                const $ = cheerio.load(x.extract);
                var extracted = $('div blockquote').text().trim();
                if (extracted.length < 200) extracted = x.extract; //no point too short. 
                const ans = await query({ "inputs": extracted });
                const ret = ans[0].summary_text;
                return ret;
            });
            setContents(extracts);
        } catch (error) {
            console.error('API call error:', error);
        } finally {
            setIsLoading(false);
            setShowRelatedContent([false, false, false, false]);
        }
    };

    return (
        <div>
            {!ready && (
                <pre> Summarizer API is Loading ... </pre>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {ready && (
                    <button
                        onClick={handleApiCall}
                        disabled={isLoading}
                        className="bg-slate-600 text-white hover:bg-slate-900 text-xl"
                    >
                        {isLoading ? 'Loading' : 'Search'}
                    </button>
                )}
            </div>

            {apiResponse && contents && (
                <div className="flex flex-col space-y-4">
                    {apiResponse.results.map((paper, index) => (
                        <div key={index} className="p-4 border rounded-md shadow-md flex flex-col">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold mb-1">{paper.title}</h2>
                                <button
                                    onClick={(e) => { handleMoreLikeThisClick(paper, index) }}
                                    className="text-blue-500 hover:underline font-semibold"
                                >
                                    {showRelatedContent[index] ? 'Hide Related' : 'Show Similar'}
                                </button>
                            </div>
                            <h3 className="text-lg font-semibold">{contents[index]}</h3>
                            <p>Authors: {paper.author}</p>
                            <p>Published {formatDate(paper.publishedDate)}</p>
                            <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline font-semibold"
                            >
                                Read More
                            </a>
                            {showRelatedContent[index] && (
                                <div>
                                    <h3 className="text-lg font-semibold mt-4">Related Content:</h3>
                                    {relatedContent[index].map((item, index) => (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {item.title} <br />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                    ))}
                </div>
            )}
        </div>
    );
};

export default ApiButton;