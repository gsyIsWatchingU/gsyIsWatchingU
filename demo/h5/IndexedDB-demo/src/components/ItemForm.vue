<template>
  <div class="form-panel">
    <h2>添加新数据</h2>
    <p class="desc">演示 IndexedDB 的 create 操作</p>

    <form @submit.prevent="handleSubmit" class="item-form">
      <div class="form-group">
        <label>名称：</label>
        <input
          type="text"
          v-model="form.name"
          placeholder="输入物品名称"
          required
        />
      </div>

      <div class="form-group">
        <label>分类：</label>
        <select v-model="form.category" required>
          <option value="">选择分类</option>
          <option value="electronics">电子产品</option>
          <option value="clothing">服装</option>
          <option value="food">食品</option>
          <option value="books">书籍</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div class="form-group">
        <label>价格：</label>
        <input
          type="number"
          v-model.number="form.price"
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div class="form-group">
        <label>数量：</label>
        <input
          type="number"
          v-model.number="form.quantity"
          placeholder="0"
          min="0"
          required
        />
      </div>

      <div class="form-group">
        <label>描述：</label>
        <textarea
          v-model="form.description"
          placeholder="输入物品描述（可选）"
          rows="3"
        ></textarea>
      </div>

      <button type="submit" class="submit-btn">
        添加到数据库
      </button>
    </form>

    <!-- 快速添加示例 -->
    <div class="quick-add">
      <h3>快速添加示例数据：</h3>
      <div class="quick-btns">
        <button @click="addSample('phone')">📱 手机</button>
        <button @click="addSample('laptop')">💻 电脑</button>
        <button @click="addSample('book')">📚 书籍</button>
        <button @click="addSample('clothes')">👕 衣服</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemForm',
  data() {
    return {
      form: {
        name: '',
        category: '',
        price: 0,
        quantity: 0,
        description: ''
      }
    }
  },
  methods: {
    handleSubmit() {
      if (!this.form.name || !this.form.category) {
        alert('请填写完整信息')
        return
      }
      this.$emit('add', { ...this.form })
      this.resetForm()
    },
    resetForm() {
      this.form = {
        name: '',
        category: '',
        price: 0,
        quantity: 0,
        description: ''
      }
    },
    addSample(type) {
      const samples = {
        phone: { name: 'iPhone 15 Pro', category: 'electronics', price: 7999, quantity: 10, description: '苹果手机' },
        laptop: { name: 'MacBook Pro 14', category: 'electronics', price: 12999, quantity: 5, description: '苹果笔记本' },
        book: { name: 'Vue.js 实战', category: 'books', price: 79, quantity: 100, description: '技术书籍' },
        clothes: { name: '纯棉 T 恤', category: 'clothing', price: 99, quantity: 50, description: '夏季服装' }
      }
      this.form = samples[type]
      this.$emit('add', { ...this.form })
      this.resetForm()
    }
  }
}
</script>

<style scoped>
.form-panel {
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

.item-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.quick-add {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.quick-add h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.quick-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-btns button {
  padding: 8px 16px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.quick-btns button:hover {
  background: #667eea;
  color: white;
}
</style>
