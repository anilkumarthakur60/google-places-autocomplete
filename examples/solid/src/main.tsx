import '@anil-labs/google-places-autocomplete-core/styles.css'
import { render } from 'solid-js/web'
import { App } from './App'

const root = document.getElementById('app')
if (!root) throw new Error('Missing #app root element')

render(() => <App />, root)
