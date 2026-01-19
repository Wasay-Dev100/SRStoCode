# GPT-OSS Setup Guide for Kinmail Extension

## 🚀 **Quick Setup:**

### 1. Install Ollama
```bash
# Windows (PowerShell)
winget install Ollama.Ollama

# Or download from: https://ollama.ai/download
```

### 2. Start Ollama
```bash
ollama serve
```

### 3. Pull GPT-OSS Models
```bash
# GPT-OSS models (recommended)
ollama pull gpt4all:7b          # GPT-OSS model
ollama pull gpt-j:6b            # EleutherAI GPT-J
ollama pull gpt-neox:20b        # EleutherAI GPT-NeoX

# Alternative GPT-OSS models
ollama pull wizard-vicuna:7b    # GPT-based model
ollama pull alpaca:7b           # GPT-based model
```

### 4. Configure Extension
1. Open VS Code Settings (`Ctrl+,`)
2. Search for "kinmail"
3. Set `kinmail.useLocalModel` to `true`
4. Set `kinmail.ollamaModel` to your chosen model (e.g., `codellama:7b`)

## 🎯 **Recommended GPT-OSS Models:**

| Model | Size | Best For | Speed | Type |
|-------|------|----------|-------|------|
| `gpt4all:7b` | 4GB | General purpose | Fast | GPT-OSS |
| `gpt-j:6b` | 3GB | Text generation | Fast | EleutherAI GPT-J |
| `gpt-neox:20b` | 12GB | Advanced tasks | Slow | EleutherAI GPT-NeoX |
| `wizard-vicuna:7b` | 4GB | Code & chat | Fast | GPT-based |
| `alpaca:7b` | 4GB | Instruction following | Fast | GPT-based |

## 🔧 **Usage:**

### Enable Local Mode:
1. **Settings** → Search "kinmail" → Check "Use Local Model"
2. **Model**: Choose your preferred model
3. **Restart** the extension

### Benefits:
- ✅ **Free** - No API costs
- ✅ **Private** - Data stays on your machine
- ✅ **Offline** - Works without internet
- ✅ **No limits** - Process unlimited SRS documents

## 🚨 **Troubleshooting:**

### Ollama not running:
```bash
ollama serve
```

### Model not found:
```bash
ollama pull [model-name]
```

### Connection refused:
- Make sure Ollama is running on `localhost:11434`
- Check firewall settings

### Slow performance:
- Try smaller models (`mistral:7b`)
- Close other applications
- Ensure you have enough RAM (8GB+ recommended)

## 🎉 **Ready to Use!**

Your extension will now use local Ollama models instead of OpenAI API!
