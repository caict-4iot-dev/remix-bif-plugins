// netlify/functions/proxy.js
const https = require('https')
const http = require('http')

exports.handler = async function (event, context) {
  // 获取请求头中的代理地址
  const proxyAddress = event.headers['proxyaddress']
  // 获取请求的路径和参数
  const path = event.path.replace('/api', '')
  const query = event.queryStringParameters
  // 构造代理的URL
  const proxyUrl = `${proxyAddress}${path}?${new URLSearchParams(query)}`
  // 创建一个HTTP请求选项对象
  const options = {
    method: event.httpMethod,
    headers: {},
  }
  // 返回一个Promise对象，用来处理代理的响应
  return new Promise((resolve, reject) => {
    // 发送一个HTTP请求到代理的URL
    const req = (proxyUrl.startsWith('https') ? https : http).request(proxyUrl, options, (res) => {
      // 获取代理的响应头和状态码
      const statusCode = res.statusCode
      // 创建一个空的响应体字符串
      let body = ''
      // 监听代理的响应数据事件
      res.on('data', (chunk) => {
        // 将响应数据拼接到响应体字符串中
        body += chunk.toString()
      })
      // 监听代理的响应结束事件
      res.on('end', () => {
        // 解析响应体字符串为JSON对象
        const data = JSON.parse(body)
        // 创建一个响应对象，包含响应头，状态码和数据
        const response = {
          statusCode,
          body: JSON.stringify(data),
        }
        // 将响应对象作为Promise的成功值返回
        resolve(response)
      })
    })
    // 监听HTTP请求的错误事件
    req.on('error', (error) => {
      // 将错误对象作为Promise的失败值返回
      reject(error)
    })
    // 如果请求方法是POST或PUT，发送请求体数据
    if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
      req.write(event.body)
    }
    // 结束HTTP请求
    req.end()
  })
}
