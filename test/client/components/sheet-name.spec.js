const test = require('ava')
const { mount, trigger, mockStore } = require('vuenit')

const SheetName = require('../../../client/src/components/sheet-name.vue')

test('renders sheet name', (t) => {
  const $store = mockStore({
    modules: {
      db: {
        activeSheet: { name: 'users' }
      }
    }
  })
  const vm = mount(SheetName, { inject: { $store } })
  const headerText = vm.$el.textContent
  t.is(headerText, 'users')
})

test.cb('calls save on blur', (t) => {
  const $store = mockStore({
    modules: {
      db: {
        activeSheet: { name: 'users' }
      }
    }
  })
  $store.when('renameSheet').call((context, payload) => {
    t.pass()
    t.end()
  })
  const vm = mount(SheetName, { inject: { $store } })
  const el = vm.$el
  trigger(el, 'focus')
  el.textContent = 'changed'
  trigger(el, 'blur')
})

// Simulating enter works, but the blur event is not triggering
// the blur event listener. This test *should* work.
test.failing.cb('calls save on press enter', (t) => {
  const $store = mockStore({
    modules: {
      db: {
        activeSheet: { name: 'users' }
      }
    }
  })
  $store.when('renameSheet').call((context, payload) => {
    t.pass()
    t.end()
  })
  const vm = mount(SheetName, { inject: { $store } })
  const el = vm.$el
  trigger(el, 'focus')
  el.textContent = 'changed'
  trigger(el, 'keydown', { keyCode: 13 })
})

test.cb('does not save if name unchanged', (t) => {
  const $store = mockStore({
    modules: {
      db: {
        activeSheet: { name: 'users' }
      }
    }
  })
  $store.when('renameSheet').call((context, payload) => {
    t.fail()
  })
  const vm = mount(SheetName, { inject: { $store } })
  const el = vm.$el
  trigger(el, 'focus')
  trigger(el, 'blur')
  window.setTimeout(() => t.end()) // is there a better way?
})
