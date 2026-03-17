<template>
  <div class="query-panel">
    <h2>查询数据</h2>
    <p class="desc">演示 IndexedDB 的 read 操作，包括全量查询和索引查询</p>

    <!-- 查询操作 -->
    <div class="query-actions">
      <button @click="$emit('query')" class="btn-primary" :disabled="loading">
        {{ loading ? '加载中...' : '📋 查询所有数据' }}
      </button>

      <div class="index-query">
        <span class="label">索引查询：</span>
        <select v-model="indexField">
          <option value="name">按名称</option>
          <option value="category">按分类</option>
          <option value="price">按价格</option>
        </select>
        <input
          v-model="indexValue"
          type="text"
          placeholder="输入查询值"
          @keyup.enter="queryByIndex"
        />
        <button @click="queryByIndex" class="btn-secondary">
          🔍 查询
        </button>
      </div>
    </div>

    <!-- 结果展示 -->
    <div class="results">
      <div class="results-header">
        <h3>查询结果</h3>
        <span class="count">{{ items.length }} 条记录</span>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>正在查询...</span>
      </div>

      <div v-else-if="items.length === 0" class="empty">
        <span class="empty-icon">📭</span>
        <p>暂无数据</p>
      </div>

      <div v-else class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <span class="item-id">#{{ item.id }}</span>
            <span class="item-category">{{ getCategoryName(item.category) }}</span>
          </div>
          <div class="item-name">{{ item.name }}</div>
          <div class="item-details">
            <span class="price">¥{{ item.price }}</span>
            <span class="quantity">库存：{{ item.quantity }}</span>
          </div>
          <div class="item-desc" v-if="item.description">{{ item.description }}</div>
          <div class="item-time">{{ formatDate(item.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemQuery',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      indexField: 'category',
      indexValue: ''
    }
  },
  methods: {
    queryByIndex() {
      if (!this.indexValue) {
        alert('请输入查询值')
        return
      }
      this.$emit('query-by-index', {
        index: this.indexField,
        value: this.indexValue
      })
    },
    getCategoryName(cat) {
      const names = {
        electronics: '电子产品',
        clothing: '服装',
        food: '食品',
        books: '书籍',
        other: '其他'
      }
      return names[cat] || cat
    },
    formatDate(str) {
      if (!str) return ''
      const d = new Date(str)
      return d.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.query-panel {
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 8px;
}

.desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.query-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #667eea;
  color: white;
}

.index-query {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.index-query .label {
  font-weight: 500;
  color: #555;
}

.index-query select,
.index-query input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.index-query select:focus,
.index-query input:focus {
  outline: none;
  border-color: #667eea;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.results-header h3 {
  color: #333;
}

.count {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.item-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e9ecef;
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-id {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.item-category {
  background: #e9ecef;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.item-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.price {
  color: #ef4444;
  font-weight: 600;
  font-size: 18px;
}

.quantity {
  color: #666;
  font-size: 14px;
}

.item-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.item-time {
  color: #999;
  font-size: 12px;
}
</style>
