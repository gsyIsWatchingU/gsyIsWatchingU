<template>
  <div class="update-panel">
    <h2>更新数据</h2>
    <p class="desc">演示 IndexedDB 的 update 操作</p>

    <!-- 选择要更新的数据 -->
    <div class="select-section">
      <h3>选择要更新的数据：</h3>
      <div v-if="items.length === 0" class="empty">
        <span class="empty-icon">📭</span>
        <p>暂无数据，请先添加数据</p>
      </div>
      <div v-else class="items-list">
        <div
          v-for="item in items"
          :key="item.id"
          :class="['item-row', { selected: selectedId === item.id }]"
          @click="selectItem(item)"
        >
          <span class="item-id">#{{ item.id }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span class="item-info">
            {{ getCategoryName(item.category) }} | ¥{{ item.price }} | 库存：{{ item.quantity }}
          </span>
        </div>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div v-if="selectedItem" class="edit-section">
      <h3>编辑数据：</h3>
      <form @submit.prevent="handleSubmit" class="edit-form">
        <div class="form-group">
          <label>名称：</label>
          <input
            type="text"
            v-model="editForm.name"
            required
          />
        </div>

        <div class="form-group">
          <label>分类：</label>
          <select v-model="editForm.category" required>
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
            v-model.number="editForm.price"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label>数量：</label>
          <input
            type="number"
            v-model.number="editForm.quantity"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label>描述：</label>
          <textarea
            v-model="editForm.description"
            rows="3"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="cancelEdit" class="btn-cancel">
            取消
          </button>
          <button type="submit" class="btn-submit">
            保存更新
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemUpdate',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedId: null,
      selectedItem: null,
      editForm: {
        id: null,
        name: '',
        category: '',
        price: 0,
        quantity: 0,
        description: ''
      }
    }
  },
  methods: {
    selectItem(item) {
      this.selectedId = item.id
      this.selectedItem = item
      this.editForm = {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        description: item.description || ''
      }
    },
    handleSubmit() {
      if (!this.selectedItem) {
        alert('请先选择要更新的数据')
        return
      }
      this.$emit('update', { ...this.editForm })
      this.cancelEdit()
    },
    cancelEdit() {
      this.selectedId = null
      this.selectedItem = null
      this.editForm = {
        id: null,
        name: '',
        category: '',
        price: 0,
        quantity: 0,
        description: ''
      }
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
    }
  }
}
</script>

<style scoped>
.update-panel {
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

h3 {
  color: #555;
  font-size: 15px;
  margin-bottom: 12px;
}

.select-section {
  margin-bottom: 24px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.item-row:hover {
  background: #e9ecef;
}

.item-row.selected {
  border-color: #667eea;
  background: #e7e9ff;
}

.item-id {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.item-name {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.item-info {
  color: #666;
  font-size: 13px;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #999;
}

.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.edit-section {
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.edit-form {
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

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>
