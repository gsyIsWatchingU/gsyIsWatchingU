<template>
  <div class="app">
    <h1>📦 IndexedDB 核心功能演示</h1>
    <p class="subtitle">Vue 3 + IndexedDB 完整 CRUD 操作</p>

    <!-- 数据库信息 -->
    <div class="db-info" v-if="dbInfo">
      <span>数据库：{{ dbInfo.name }}</span>
      <span>版本：{{ dbInfo.version }}</span>
      <span>对象仓库：{{ dbInfo.objectStoreNames.join(', ') }}</span>
    </div>

    <!-- 功能标签页 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: currentTab === tab.id }]"
        @click="currentTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 添加数据 -->
    <div v-show="currentTab === 'add'" class="panel">
      <ItemForm @add="handleAdd" />
    </div>

    <!-- 查询数据 -->
    <div v-show="currentTab === 'query'" class="panel">
      <ItemQuery
        :items="items"
        :loading="loading"
        @query="handleQuery"
        @query-by-index="handleQueryByIndex"
      />
    </div>

    <!-- 更新数据 -->
    <div v-show="currentTab === 'update'" class="panel">
      <ItemUpdate
        :items="items"
        @select="handleSelectForUpdate"
        @update="handleUpdate"
      />
    </div>

    <!-- 删除数据 -->
    <div v-show="currentTab === 'delete'" class="panel">
      <ItemDelete
        :items="items"
        @delete="handleDelete"
        @clear="handleClear"
        @delete-db="handleDeleteDB"
      />
    </div>

    <!-- 消息提示 -->
    <transition name="fade">
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script>
import { db } from './utils/db.js'
import ItemForm from './components/ItemForm.vue'
import ItemQuery from './components/ItemQuery.vue'
import ItemUpdate from './components/ItemUpdate.vue'
import ItemDelete from './components/ItemDelete.vue'

export default {
  name: 'App',
  components: {
    ItemForm,
    ItemQuery,
    ItemUpdate,
    ItemDelete
  },
  data() {
    return {
      currentTab: 'add',
      tabs: [
        { id: 'add', label: '➕ 添加数据' },
        { id: 'query', label: '🔍 查询数据' },
        { id: 'update', label: '✏️ 更新数据' },
        { id: 'delete', label: '🗑️ 删除数据' }
      ],
      items: [],
      dbInfo: null,
      loading: false,
      message: '',
      messageType: 'success'
    }
  },
  async mounted() {
    try {
      await db.openDB()
      this.dbInfo = db.getDBInfo()
      this.showMessage('数据库初始化成功', 'success')
      this.loadItems()
    } catch (error) {
      this.showMessage('数据库初始化失败：' + error.message, 'error')
    }
  },
  methods: {
    async loadItems() {
      this.loading = true
      try {
        this.items = await db.getAll()
      } catch (error) {
        this.showMessage('加载数据失败', 'error')
      } finally {
        this.loading = false
      }
    },
    async handleAdd(item) {
      try {
        await db.add(item)
        this.showMessage('数据添加成功', 'success')
        this.loadItems()
      } catch (error) {
        this.showMessage('添加失败：' + error.message, 'error')
      }
    },
    async handleQuery() {
      this.loading = true
      try {
        this.items = await db.getAll()
        this.showMessage(`共查询到 ${this.items.length} 条数据`, 'success')
      } catch (error) {
        this.showMessage('查询失败', 'error')
      } finally {
        this.loading = false
      }
    },
    async handleQueryByIndex({ index, value }) {
      this.loading = true
      try {
        this.items = await db.getByIndex(index, value)
        this.showMessage(`通过索引 "${index}" 查询到 ${this.items.length} 条数据`, 'success')
      } catch (error) {
        this.showMessage('索引查询失败', 'error')
      } finally {
        this.loading = false
      }
    },
    handleSelectForUpdate(item) {
      this.$refs.updateForm?.setItem(item)
    },
    async handleUpdate(item) {
      try {
        await db.update(item)
        this.showMessage('数据更新成功', 'success')
        this.loadItems()
      } catch (error) {
        this.showMessage('更新失败', 'error')
      }
    },
    async handleDelete(id) {
      try {
        await db.delete(id)
        this.showMessage('数据删除成功', 'success')
        this.loadItems()
      } catch (error) {
        this.showMessage('删除失败', 'error')
      }
    },
    async handleClear() {
      if (!confirm('确定要清空所有数据吗？')) return
      try {
        await db.clear()
        this.showMessage('所有数据已清空', 'success')
        this.items = []
      } catch (error) {
        this.showMessage('清空失败', 'error')
      }
    },
    async handleDeleteDB() {
      if (!confirm('确定要删除整个数据库吗？此操作不可恢复！')) return
      try {
        await db.deleteDatabase()
        this.dbInfo = null
        this.items = []
        this.showMessage('数据库已删除，请刷新页面重新初始化', 'success')
      } catch (error) {
        this.showMessage('删除数据库失败', 'error')
      }
    },
    showMessage(text, type = 'success') {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 3000)
    }
  }
}
</script>

<style>
.app {
  max-width: 900px;
  margin: 0 auto;
  color: #333;
}

h1 {
  text-align: center;
  color: white;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  text-align: center;
  color: rgba(255,255,255,0.9);
  margin-bottom: 20px;
}

.db-info {
  background: rgba(255,255,255,0.95);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
}

.db-info span {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px 20px;
  border: none;
  background: rgba(255,255,255,0.3);
  color: white;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(255,255,255,0.5);
}

.tab-btn.active {
  background: white;
  color: #667eea;
  font-weight: bold;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.message.success {
  background: #10b981;
}

.message.error {
  background: #ef4444;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .db-info {
    flex-direction: column;
    gap: 10px;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    min-width: 100%;
  }
}
</style>
