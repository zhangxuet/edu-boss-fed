import axios from 'axios'
import store from '@/store'
import router from '@/router'
import { Message } from 'element-ui'
import qs from 'qs'

const request = axios.create({
  // baseURL: '',
})

function redirectLogin () {
  router.push({
    name: 'login',
    query: {
      redirect: router.currentRoute.fullPath
    }
  })
}

function refreshToken () {
  return axios.create()({
    method: 'POST',
    url: '/front/user/refresh_token',
    data: qs.stringify({
      refreshtoken: store.state.user.refresh_token
    })
  })
}

request.interceptors.request.use(function (config) {
  const { user } = store.state
  if (user && user.access_token) {
    config.headers.Authorization = user.access_token
  }
  return config
}, function (error) {
  return Promise.reject(error)
})

let refreshing = false
let requests: any[] = [] // 存储401请求
request.interceptors.response.use(function (response) {
  // 200进入
  // 自定义状态码错误请求
  // console.log('response' + response)

  return response
}, function (error) {
  // console.dir('error' + error)
  if (error.response) { // 响应成功
    const { status } = error.response
    if (status === 400) {
      Message.error('请求参数错误')
    } else if (status === 401) {
      if (!store.state.user) {
        redirectLogin()
        return Promise.reject(error)
      }

      if (!refreshing) {
        refreshing = true
        return refreshToken().then(res => {
          if (!res.data.success) {
            throw new Error('刷新token失败')
          }
          store.commit('setUser', res.data.content)
          // 刷新token成功
          requests.forEach(cb => cb())
          requests = []
          return request(error.config)
        })
          .catch(err => {
            store.commit('setUser', null)
            redirectLogin()
            return Promise.reject(err)
          })
          .finally(() => {
            refreshing = false
          })
      }

      // 刷新状态下把请求挂起放到requests(不执行resolve的promise)
      return new Promise(resolve => {
        return requests.push(() => {
          resolve(request(error.config))
        })
      })
    } else if (status === 403) {
      Message.error('没有权限，请联系管理员')
    } else if (status === 404) {
      Message.error('请求资源不存在')
    } else if (status >= 500) {
      Message.error('服务端错误，请联系管理员')
    }
  } else if (error.request) { // 响应失败
    Message.error('请求超时 请刷新重试')
  } else { // 请求设置错误
    Message.error(`请求失败${error.message}`)
  }
  return Promise.reject(error)
})

export default request
