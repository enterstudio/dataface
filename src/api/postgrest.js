const axios = require('axios')
const urlJoin = require('url-join')
const keys = require('lodash/keys')
const mapValues = require('lodash/mapValues')

const postgrestHost = process.env.POSTGREST_HOST

const db = {
  async getTables () {
    const url = constructUrl()
    const response = await axios.get(url)
    const tables = keys(response.data.definitions)
    return tables.filter((table) => !table.startsWith('(rpc)'))
      .map((table) => ({ name: table }))
  },

  async getRows (table, order) {
    const url = constructUrl(table)
    const params = { order }
    const response = await axios.get(url, { params })
    return response.data
  },

  async getSchema (table) {
    const url = constructUrl('rpc/get_schema')
    const response = await axios.post(url, { table_name_param: table })
    const columnsWithEditable = response.data.map(addEditable)
    return columnsWithEditable
  },

  async getColumn (table, column) {
    const url = constructUrl('rpc/get_schema')
    const response = await axios.post(url, { table_name_param: table })
    const responseItem = response.data.find((row) => row.name === column)
    return addEditable(responseItem)
  },

  async update (table, updates, conditions) {
    const url = constructUrl(table)
    const params = parameterizeConditions(conditions)
    const headers = {
      'Prefer': 'return=representation', // include row in response
      'Accept': 'application/vnd.pgrst.object+json' // return obj not array
    }
    const response = await axios.patch(url, updates, { params, headers })
    return response.data
  },

  async insert (table, updates) {
    const url = constructUrl(table)
    const headers = {
      'Prefer': 'return=representation', // include row in response
      'Accept': 'application/vnd.pgrst.object+json' // return obj not array
    }
    const response = await axios.post(url, updates, { headers })
    return response.data
  },

  async deleteRow (table, conditions) {
    const url = constructUrl(table)
    const params = parameterizeConditions(conditions)
    const response = axios.delete(url, { params })
    return response.data
  },

  async insertColumn (table, name) {
    const url = constructUrl('rpc/insert_column')
    const payload = { table_name: table, column_name: name }
    await axios.post(url, payload)
    return await db.getColumn(table, name)
  },

  async renameColumn (table, oldName, newName) {
    const url = constructUrl('rpc/rename_column')
    const payload = { table_name: table, old_name: oldName, new_name: newName }
    const response = await axios.post(url, payload)
    return response.data
  },

  async deleteColumn (table, name) {
    const url = constructUrl('rpc/drop_column')
    const payload = { table_name: table, column_name: name }
    const response = await axios.post(url, payload)
    return response.data
  },

  async insertTable (name) {
    const url = constructUrl('rpc/insert_table')
    const payload = { table_name: name }
    const response = await axios.post(url, payload)
    return response.data
  },

  async renameTable (oldName, name) {
    const url = constructUrl('rpc/rename_table')
    const payload = { old_name: oldName, new_name: name }
    const response = await axios.post(url, payload)
    return response.data
  },

  async deleteTable (name) {
    const url = constructUrl('rpc/drop_table')
    const payload = { table_name: name }
    const response = await axios.post(url, payload)
    return response.data
  }
}

function constructUrl (path) {
  return urlJoin(postgrestHost, path)
}

function parameterizeConditions (conditions) {
  return mapValues(conditions, (value) => {
    const operator = (typeof value === 'boolean' || value === null) ? 'is' : 'eq'
    return `${operator}.${value}`
  })
}

function addEditable (column) {
  column.editable = !(column.default && column.default.startsWith('nextval'))
  return column
}

module.exports = db