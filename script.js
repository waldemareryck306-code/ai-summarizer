async function generateSummary() {
    const inputText = document.getElementById('inputText').value.trim();
    const summaryLength = document.getElementById('summaryLength').value;
    const outputBox = document.getElementById('outputText');
    const loading = document.getElementById('loading');
    const copyBtn = document.getElementById('copyBtn');
    
    if (!inputText) {
        alert('请输入文章内容！');
        return;
    }
    
    if (inputText.length < 50) {
        alert('文章内容太短，请输入至少50个字符！');
        return;
    }
    
    loading.style.display = 'block';
    outputBox.innerHTML = '<p class="placeholder">正在生成摘要...</p>';
    copyBtn.style.display = 'none';
    
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: inputText,
                parameters: {
                    max_length: summaryLength === 'short' ? 50 : summaryLength === 'medium' ? 130 : 200,
                    min_length: summaryLength === 'short' ? 20 : summaryLength === 'medium' ? 50 : 80,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('API 请求失败');
        }
        
        const result = await response.json();
        
        let summary;
        if (Array.isArray(result) && result[0]?.summary_text) {
            summary = result[0].summary_text;
        } else if (result.error) {
            summary = generateLocalSummary(inputText, summaryLength);
            outputBox.innerHTML = `<p><strong>⚠️ 使用本地算法生成（API 模型加载中）</strong></p><p>${summary}</p>`;
        } else {
            throw new Error('无法解析响应');
        }
        
        outputBox.innerHTML = `<p>${summary}</p>`;
        copyBtn.style.display = 'block';
        
    } catch (error) {
        console.error('错误:', error);
        const summary = generateLocalSummary(inputText, summaryLength);
        outputBox.innerHTML = `<p><strong>⚠️ 使用本地算法生成</strong></p><p>${summary}</p>`;
        copyBtn.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function generateLocalSummary(text, length) {
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [text];
    
    const maxSentences = length === 'short' ? 2 : length === 'medium' ? 3 : 5;
    const summary = sentences.slice(0, Math.min(maxSentences, sentences.length)).join(' ');
    
    return summary.trim() || text.substring(0, 200) + '...';
}

function copySummary() {
    const outputText = document.getElementById('outputText').innerText;
    navigator.clipboard.writeText(outputText).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.innerText;
        btn.innerText = '✓ 已复制！';
        setTimeout(() => {
            btn.innerText = originalText;
        }, 2000);
    });
}
