import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/types'
import { getUser, saveUser } from './store'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(getUser())

  function setUser(data: User) {
    saveUser(data)
    user.value = data
  }

  return { user, setUser }
})
