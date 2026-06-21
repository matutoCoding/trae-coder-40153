export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/cranes/index',
    'pages/recommend/index',
    'pages/orders/index',
    'pages/crane-detail/index',
    'pages/recommend-detail/index',
    'pages/order-detail/index',
    'pages/weight-config/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5EFA',
    navigationBarTitleText: '吊车调度',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5EFA',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '排期'
      },
      {
        pagePath: 'pages/cranes/index',
        text: '吊车'
      },
      {
        pagePath: 'pages/recommend/index',
        text: '推荐'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      }
    ]
  }
})
