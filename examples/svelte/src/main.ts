import '@anil-labs/google-places-autocomplete-core/styles.css'
import { mount } from 'svelte'
import App from './App.svelte'

const root = document.getElementById('app')
if (!root) throw new Error('Missing #app root element')

mount(App, { target: root })
