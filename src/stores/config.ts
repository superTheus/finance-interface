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

  function changeTheme() {
    config.value.darkMode = !config.value.darkMode

    saveConfig(config.value)
    if (config.value.darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  return { config, setConfig, changeTheme }
})
