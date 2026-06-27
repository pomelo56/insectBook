// 微信小程序 API Mock — Jest 全局 setup
// 在 jest.config.js 的 setupFiles 中引用

// wx 全局对象 mock
global.wx = {
  cloud: {
    callFunction: jest.fn().mockResolvedValue({ result: { data: [] } }),
    database: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: [] }),
          count: jest.fn().mockResolvedValue({ total: 0 }),
        }),
        get: jest.fn().mockResolvedValue({ data: [] }),
        add: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
        update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: {} }),
          update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
          remove: jest.fn().mockResolvedValue({ stats: { removed: 1 } }),
        }),
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    }),
    uploadFile: jest.fn().mockResolvedValue({ fileID: 'mock-file-id' }),
  },
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn().mockReturnValue(null),
  removeStorageSync: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  redirectTo: jest.fn(),
  compressImage: jest.fn().mockResolvedValue({ tempFilePath: '/tmp/compressed.jpg' }),
  chooseImage: jest.fn().mockResolvedValue({ tempFilePaths: ['/tmp/image.jpg'] }),
  getFileSystemManager: jest.fn().mockReturnValue({
    readFile: jest.fn().mockResolvedValue('base64data'),
  }),
  getSystemInfoSync: jest.fn().mockReturnValue({ windowWidth: 375 }),
  createSelectorQuery: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      boundingClientRect: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
}

// getApp mock
global.getApp = jest.fn().mockReturnValue({
  globalData: {
    userInfo: null,
    insects: [],
    userInsects: [],
    openid: 'mock-openid',
  },
})
