import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getConfig, saveConfig } from './store'
import type { Config } from '@/types/types'

export const useConfigStore = defineStore('config', () => {
  const config = ref<Config>(getConfig())

  function setConfig(data: Config) {
    saveConfig(data)
    config.value = data
  }

  return { config, setConfig }
})
