# 🤖 AI Model Upgrade Guide - Claude Sonnet 4.5

**Status:** ✅ **Updated to Latest Model**

---

## ⚠️ Important: Model Deprecation

**`claude-3-5-sonnet-20241022` has been DEPRECATED** (retired October 22, 2025)

The code has been updated to use **Claude Sonnet 4** (`claude-sonnet-4-20250514`), which is the latest stable and recommended model.

---

## 📊 Model Comparison

### Current Implementation: Claude Sonnet 4
- **Model ID:** `claude-sonnet-4-20250514`
- **Status:** ✅ Active & Recommended
- **Knowledge Cutoff:** April 2025
- **Context Window:** 200K tokens
- **Best For:** General permit review, document analysis, structured tasks

### Recommended Options:

#### 1. **Claude Sonnet 4** (Current Default) ✅
- **Model ID:** `claude-sonnet-4-20250514`
- **Cost:** ~$3 per million input tokens, ~$15 per million output tokens
- **Performance:** Excellent for permit review tasks
- **Use When:** Standard permit review, document completeness checks, compliance scoring

#### 2. **Claude Sonnet 4.5** (Best Balance) ⭐
- **Model ID:** `claude-sonnet-4-5-20250929` (check latest in Anthropic docs)
- **Cost:** Similar to Sonnet 4
- **Performance:** Better reasoning, coding, agentic tasks
- **Use When:** Complex permit reviews, multi-document analysis, advanced reasoning

#### 3. **Claude Opus 4.5** (Highest Quality) 🏆
- **Model ID:** `claude-opus-4-20250514` or `claude-opus-4-5-*`
- **Cost:** Higher (~$15 per million input tokens)
- **Performance:** Best accuracy, complex reasoning, multimodal
- **Use When:** Critical permit reviews, large document sets, visual analysis (floor plans, maps)

---

## 🔧 Configuration

### Environment Variable

```bash
# Default (Sonnet 4)
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# For best balance (Sonnet 4.5)
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# For highest quality (Opus 4.5)
ANTHROPIC_MODEL=claude-opus-4-5-20250929
```

### Code Configuration

The model is now configurable via `config.anthropicModel`:

```typescript
// services/api/src/config/index.ts
anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
```

---

## 📈 Performance Comparison

| Model | Accuracy | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| **Sonnet 4** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Standard reviews |
| **Sonnet 4.5** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Complex reviews |
| **Opus 4.5** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Critical reviews |

---

## 🎯 Recommendations for Permit Review

### **Standard Permit Review** (Most Cases)
✅ **Use: Claude Sonnet 4** (`claude-sonnet-4-20250514`)
- Good balance of cost and performance
- Sufficient for most permit applications
- Fast response times

### **Complex Permit Review** (Multi-document, Complex Rules)
⭐ **Use: Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)
- Better reasoning for complex scenarios
- Improved document understanding
- Better at detecting subtle issues

### **Critical Permit Review** (High-stakes, Visual Analysis)
🏆 **Use: Claude Opus 4.5** (`claude-opus-4-5-*`)
- Highest accuracy
- Best for visual document analysis (floor plans, site plans)
- Superior for complex multi-document reviews

---

## 🔄 Migration Steps

### 1. Update Environment Variable

```bash
# Development (.env.local)
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Production (Railway/Vercel)
# Set via environment variables dashboard
```

### 2. Test with New Model

```bash
# Test permit review endpoint
curl -X POST http://localhost:3001/api/permits/{id}/ai-review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### 3. Monitor Performance

- Compare review quality
- Check response times
- Monitor costs
- Review accuracy metrics

---

## 💰 Cost Considerations

**Estimated Cost per Permit Review:**

- **Sonnet 4:** ~$0.001-0.005 per review
- **Sonnet 4.5:** ~$0.001-0.005 per review (similar)
- **Opus 4.5:** ~$0.005-0.015 per review (3x higher)

**Recommendation:** Start with Sonnet 4, upgrade to Sonnet 4.5 if needed, use Opus 4.5 only for critical reviews.

---

## ✅ What Changed

1. ✅ Updated default model from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-20250514`
2. ✅ Made model configurable via `ANTHROPIC_MODEL` environment variable
3. ✅ Added fallback to Sonnet 4 if model not specified
4. ✅ Updated both `reviewPermitWithAI` and `generateReportSummary` functions

---

## 📚 Resources

- **Anthropic Models Documentation:** https://docs.anthropic.com/en/docs/models-overview
- **Model Comparison:** https://docs.anthropic.com/en/docs/about-claude/models/all-models
- **Pricing:** https://www.anthropic.com/pricing

---

## 🚀 Next Steps

1. **Set `ANTHROPIC_MODEL` environment variable** to your preferred model
2. **Test permit reviews** with the new model
3. **Monitor performance** and adjust if needed
4. **Consider Sonnet 4.5** if you need better reasoning
5. **Use Opus 4.5** only for critical/high-stakes reviews

---

**Status:** ✅ **Upgraded to Latest Model**  
**Default Model:** `claude-sonnet-4-20250514`  
**Last Updated:** January 2026


