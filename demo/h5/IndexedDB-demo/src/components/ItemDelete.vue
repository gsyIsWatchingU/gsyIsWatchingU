<template>
  <div class="delete-panel">
    <h2>删除数据</h2>
    <p class="desc">演示 IndexedDB 的 delete 操作</p>

    <!-- 删除单条数据 -->
    <div class="delete-section">
      <h3>删除单条数据：</h3>
      <div v-if="items.length === 0" class="empty">
        <span class="empty-icon">📭</span>
        <p>暂无数据</p>
      </div>
      <div v-else class="items-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-row"
        >
          <div class="item-info">
            <span class="item-id">#{{ item.id }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-detail">
              {{ getCategoryName(item.category) }} | ¥{{ item.price }}
            </span>
          </div>
          <button @click="deleteItem(item.id)" class="btn-delete">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div class="bulk-section">
      <h3>批量操作：</h3>
      <div class="bulk-actions">
        <button @click="$emit('clear')" class="btn-warning">
          🧹 清空所有数据
        </button>
        <button @click="$emit('delete-db')" class="btn-danger">
          💥 删除整个数据库
        </button>
      </div>
      <p class="warning">
        ⚠️ 注意：清空所有数据将删除对象仓库中的所有记录，但保留数据库结构。<br>
        ⚠️ 删除整个数据库将完全移除数据库，需要重新初始化才能使用。
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemDelete',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    deleteItem(id) {
      if (confirm('确定要删除这条数据吗？')) {
        this.$emit('delete', id)
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
.delete-panel {
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

.delete-section {
  margin-bottom: 24px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
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
}

.item-detail {
  color: #666;
  font-size: 13px;
}

.btn-delete {
  padding: 8px 16px;
  background: #fee;
  color: #ef4444;
  border: 2px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
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

.bulk-section {
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.bulk-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-warning,
.btn-danger {
  flex: 1;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.warning {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 12px 16px;
  border-radius: 4px;
  color: #92400e;
  font-size: 13px;
  line-height: 1.6;
}
</style>
