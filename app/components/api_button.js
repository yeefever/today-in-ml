import React, { useEffect, useState } from 'react';
import Metaphor from 'metaphor-node';
import cheerio from 'cheerio';

const api_key = process.env.NEXT_PUBLIC_API_KEY;
const metaphor = new Metaphor(api_key);
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

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
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

const ApiButton = ({ searchQuery }) => {
    const [ready, setReady] = useState(false);
    const [apiStatus, setApiStatus] = useState(null);
    const [eta, setETA] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState('');
    const [contents, setContents] = useState(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (ready) {
                clearInterval(intervalId);
                return;
            }

            query({ "inputs": 'This paper introduces an approach that combines the language reasoning capabilities of large language models (LLMs) with the benefits of local training to tackle complex, domain-specific tasks. Specifically, the authors demonstrate their approach by extracting structured condition codes from pathology reports. The proposed approach utilizes local LLMs, which can be fine-tuned to respond to specific generative instructions and provide structured outputs. The authors collected a dataset of over 150k uncurated surgical pathology reports, containing gross descriptions, final diagnoses, and condition codes. They trained different model architectures, including LLaMA, BERT and LongFormer and evaluated their performance. The results show that the LLaMA-based models significantly outperform BERT-style models across all evaluated metrics, even with extremely reduced precision. The LLaMA models performed especially well with large datasets, demonstrating their ability to handle complex, multi-label tasks. Overall, this work presents an effective approach for utilizing LLMs to perform domain-specific tasks using accessible hardware, with potential applications in the medical domain, where complex data extraction and classification are required.' }).then((response) => {
                console.log(JSON.stringify(response[0]));
                if (response[0].hasOwnProperty('summary_text')) {
                    console.log('MODEL LAODED: :)');
                    setReady(true);
                }
            });
        }, 10000);

        if (ready) {
            clearInterval(intervalId);
        }

        return () => clearInterval(intervalId);
    }, [ready]);

    const handleApiCall = async () => {
        console.log('Running Handle Call on Query : ' + searchQuery);
        setIsLoading(true);
        try {
            const response = await metaphor.search(`Recent papers in ${searchQuery}`, {
                numResults: 2,
                includeDomains: ["https://arxiv.org", "https://scholar.google.com", "https://nips.cc", "https://icml.cc", "http://www.jmlr.org", "https://www.mitpressjournals.org", "https://dl.acm.org", "https://ieeexplore.ieee.org"],
                startPublishedDate: "2023-05-10",
                useAutoprompt: true,
            });

            setApiResponse(response);

            console.log(response);

            const paperIds = response.results.map((paper) => paper.id);
            const responsesArray = await metaphor.getContents(paperIds);
            const extracts = responsesArray.contents.map((x) => {
                const $ = cheerio.load(x.extract);
                const extracted = $('div blockquote').text().trim();
                console.log('Summarizing ' + extracted);
                return query({ "inputs": extracted }).then((response) => response[0].summary_text);
            });
            setContents(extracts);

        } catch (error) {
            console.error('API call error:', error);
        } finally {
            setIsLoading(false);
        }
        console.log('done');
    };

    return (
        <div>
            {!ready && (
                <pre> Summarizer API is Loading ... </pre>
            )}
            {ready && (
                <button onClick={handleApiCall} disabled={isLoading}>
                    {isLoading ? 'Loading' : 'Make API Call'}
                </button>)}
            {apiResponse && contents && (
                <div className="flex flex-col space-y-4">
                    {apiResponse.results.map((paper, index) => (
                        <div key={index} className="p-4 border rounded-md shadow-md">
                            <h3 className="text-lg font-semibold">{paper.title}</h3>
                            <p>Published: {formatDate(paper.publishedDate)}</p>
                            <p>Authors: {paper.author}</p>
                            <p>Contents: {contents[index]} </p>
                            <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                Read More
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApiButton;