<script setup lang="ts">
import { useConfig } from "../config";

const cfg = useConfig();

interface SettingField {
  label: string;
  type: 'checkbox' | 'text';
  key: 'enabled' | 'useAppleMusicClientName' | 'url' | 'apiKey';
  placeholder?: string;
}

const generalSettings: SettingField[] = [
  {
    label: 'Enable ListenBrainz Integration',
    type: 'checkbox',
    key: 'enabled'
  },
  {
    label: 'Use Apple Music Client Name',
    type: 'checkbox',
    key: 'useAppleMusicClientName'
  }
];

const apiSettings: SettingField[] = [
  {
    label: 'ListenBrainz API URL',
    type: 'text',
    key: 'url',
    placeholder: 'Enter API URL'
  },
  {
    label: 'API Key',
    type: 'text',
    key: 'apiKey',
    placeholder: 'Enter your API key'
  }
];

const handleInputChange = (field: 'url' | 'apiKey', value: string) => {
  cfg[field] = value;
};
</script>

<template>
  <div class="settings-container">
    <h2 class="settings-title">ListenBrainz Settings</h2>
    
    <div class="settings-group">
      <div v-for="setting in generalSettings" :key="setting.key" class="settings-item">
        <label class="switch">
          <input 
            :type="setting.type"
            v-model="cfg[setting.key]"
          >
          <span class="slider">{{ setting.label }}</span>
        </label>
      </div>
    </div>

    <div class="settings-group">
      <div v-for="setting in apiSettings" :key="setting.key" class="settings-item">
        <label class="input-label">
          {{ setting.label }}
          <input
            :type="setting.type"
            class="settings-input"
            :value="cfg[setting.key]"
            @input="(e) => handleInputChange(setting.key as 'url' | 'apiKey', (e.target as HTMLInputElement).value)"
            :placeholder="setting.placeholder"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.settings-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-text-primary);
}

.settings-group {
  background: var(--color-background-secondary);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-item {
  margin-bottom: 1.25rem;
}

.settings-item:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.settings-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.settings-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.settings-input::placeholder {
  color: var(--color-text-tertiary);
}

.switch {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.switch input {
  margin-right: 0.75rem;
  cursor: pointer;
}

.slider {
  color: var(--color-text-primary);
  font-weight: 500;
}

:root {
  --color-background-primary: #ffffff;
  --color-text-tertiary: #9ca3af;
}
</style>