import logging
import math
import os

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from openai import OpenAI

logging.disable(logging.CRITICAL)

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"), base_url=os.environ.get("OPENAI_BASE_URL")
)


mcp = FastMCP("relevance-analysis")


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    similarity = dot_product / (magnitude1 * magnitude2)
    return similarity


def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(input=text, model="BAAI/bge-m3")
    return response.data[0].embedding


@mcp.tool()
def compute_similarity(text1: str, text2: str) -> float:
    """计算两个文本之间的余弦相似度

    Args:
        text1 (str): 第一个文本
        text2 (str): 第二个文本
    """
    embedding1 = get_embedding(text1)
    embedding2 = get_embedding(text2)
    return cosine_similarity(embedding1, embedding2)


@mcp.tool()
def analyze_keyword_relevance(keywords: list[str], texts: list[str]) -> str:
    """分析一组文本和一组关键词之间的相关性

    Args:
        keywords (list[str]): 关键词列表
        texts (list[str]): 文本列表
    """
    results = []
    for text in texts:
        text_embedding = get_embedding(text)
        keyword_scores = {}
        for keyword in keywords:
            keyword_embedding = get_embedding(keyword)
            score = cosine_similarity(text_embedding, keyword_embedding)
            keyword_scores[keyword] = score

        most_relevant_keyword = max(keyword_scores, key=keyword_scores.get)
        highest_score = keyword_scores[most_relevant_keyword]

        results.append(
            {
                "text": text,
                "keyword_scores": keyword_scores,
                "most_relevant_keyword": most_relevant_keyword,
                "highest_score": highest_score,
            }
        )

    formatted_results = "\n".join(
        f"文本: {result['text']}\n"
        + "关键词相关性分数:\n"
        + "\n".join([f"  {k}: {v:.4f}" for k, v in result["keyword_scores"].items()])
        + f"\n最相关的关键词: {result['most_relevant_keyword']} (分数: {result['highest_score']:.4f})\n"
        for result in results
    )

    return formatted_results


if __name__ == "__main__":
    mcp.run(transport="stdio")
