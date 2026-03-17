// IndexedDB 封装工具类
// 展示 IndexedDB 核心功能：打开数据库、创建对象仓库、事务、增删改查、索引、游标

const DB_NAME = 'VueIndexedDBDemo'
const DB_VERSION = 1
const STORE_NAME = 'items'

class IndexedDBHelper {
  constructor() {
    this.db = null
  }

  // 1. 打开数据库（包含创建/升级逻辑）
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      // 数据库首次创建或版本升级时触发
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('数据库版本升级，当前版本:', event.oldVersion, '->', event.newVersion)

        // 2. 创建对象仓库（类似表）
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          })

          // 3. 创建索引（用于高效查询）
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('category', 'category', { unique: false })
          store.createIndex('price', 'price', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        console.log('数据库打开成功')
        resolve(this.db)
      }

      request.onerror = (event) => {
        console.error('数据库打开失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  // 确保数据库已打开
  async ensureDB() {
    if (!this.db) {
      await this.openDB()
    }
    return this.db
  }

  // 4. 添加数据（Create）
  async add(item) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      // 5. 创建事务（只写）
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const data = {
        ...item,
        createdAt: new Date().toISOString()
      }

      const request = store.add(data)

      request.onsuccess = () => {
        console.log('数据添加成功，ID:', request.result)
        resolve({ id: request.result, ...data })
      }

      request.onerror = (event) => {
        console.error('数据添加失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  // 读取单个数据（Read）
  async get(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 读取所有数据
  async getAll() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 6. 通过索引查询
  async getByIndex(indexName, value) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 7. 更新数据（Update）
  async update(item) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put(item)

      request.onsuccess = () => {
        console.log('数据更新成功')
        resolve(item)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 8. 删除数据（Delete）
  async delete(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log('数据删除成功')
        resolve(true)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 9. 使用游标遍历数据（Cursor）
  async iterateWithCursor(callback) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      const results = []

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          results.push(cursor.value)
          if (callback) {
            callback(cursor.value, cursor.key)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 10. 范围查询（使用 IDBKeyRange）
  async getByRange(keyRange) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll(keyRange)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 11. 清空对象仓库
  async clear() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('数据已清空')
        resolve(true)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 12. 删除整个数据库
  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME)

      request.onsuccess = () => {
        this.db = null
        console.log('数据库已删除')
        resolve(true)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  // 获取数据库信息
  getDBInfo() {
    if (!this.db) return null
    return {
      name: this.db.name,
      version: this.db.version,
      objectStoreNames: Array.from(this.db.objectStoreNames)
    }
  }
}

// 导出单例
export const db = new IndexedDBHelper()
export default IndexedDBHelper
