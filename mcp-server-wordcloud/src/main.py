import jieba
from keybert import KeyBERT
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("wordcloud")

score_threshold = 0.1
count_threshold = 200


with open("baidu_stopwords.txt", encoding="utf-8") as f:
    stop_words = {w.strip() for w in f if w.strip()}

kw_model = KeyBERT(model="paraphrase-multilingual-MiniLM-L12-v2")


def format_keywords(keywords: list[tuple[str, float]]) -> str:
    return "\n".join([f"{kw} (得分: {score:.4f})" for kw, score in keywords])


@mcp.tool()
def generate_keywords(content: str) -> str:
    """从文本内容中提取关键词

    Args:
        content (str): 输入的文本内容
    """
    tokens = [w for w in jieba.lcut(content) if w not in stop_words]
    doc = " ".join(tokens)
    keywords = kw_model.extract_keywords(
        doc,
        keyphrase_ngram_range=(1, 1),
        stop_words=None,
        use_mmr=True,
        diversity=0.6,
        top_n=1000,
    )

    keywords = [(kw, score) for kw, score in keywords if score >= score_threshold]
    keywords = sorted(keywords, key=lambda x: x[1], reverse=True)[:count_threshold]

    return format_keywords(keywords)


if __name__ == "__main__":
    mcp.run(transport="stdio")
