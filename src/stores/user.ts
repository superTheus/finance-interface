import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/types'
import { clearSession, getUser, saveUser } from './store'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(getUser())
  const route = useRouter()
  function setUser(data: User) {
    saveUser(data)
    user.value = data
  }

  function logout() {
    user.value = null
    clearSession()
    route.push({ name: 'home' })
  }

  return { user, setUser, logout }
})
