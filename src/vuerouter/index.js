let _Vue = null

// Vue.js 的插件应该暴露一个 install 方法。这个方法的第一个参数是 Vue 构造器，第二个参数是一个可选的选项对象
export default class VueRouter {
    static install (Vue) {
        //* 01 判断插件是否已经被安装
        if (VueRouter.install.installed) return
        VueRouter.install.installed = true

        //* 02 把 Vue 的构造函数记录到全局变量中去
        _Vue = Vue

        //* 03 创建实例时传入的 router 对象注入到所有的 Vue 实例上
        // _Vue.prototype.$router = this.$options.router

        //! 全局混入
        _Vue.mixin({
            beforeCreate () {
                // 全局混入，防止组件中再次执行，因此添加逻辑判断
                if (this.$options.router) {
                    _Vue.prototype.$router = this.$options.router
                    this.$options.router.init()
                }
            },
        })
    }

    constructor(options) {
        this.options = options

        // 将 options 中的路由规则解析出来进行存储
        this.routeMap = {}

        // data 应该是一个响应式的对象
        this.data = _Vue.observable({
            // 当前的路由地址，默认是 /
            current: "/"
        })
    }

    // 初始化的方法
    init () {
        this.createRouteMap()
        this.initComponents(_Vue)
        this.initEvent()
    }

    createRouteMap () {
        // 遍历所有的路由规则，把路由规则解析成键值对的形式，存储到 routeMap 中
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component
        })
    }

    initComponents (Vue) {
        // 创建 router-link 组件
        Vue.component("router-link", {
            props: {
                to: String
            },
            // template: '<a :href="to"><slot></slot></a>'
            render (h) {
                // h 的作用是帮助我们创建虚拟DOM
                return h("a", {
                    attrs: {
                        href: this.to
                    },
                    on: {
                        click: this.clickHandler
                    }
                }, [this.$slots.default])
            },
            methods: {
                clickHandler (e) {
                    // 调用 pushState 方法改变浏览器的地址栏
                    history.pushState({}, "", this.to)
                    this.$router.data.current = this.to
                    e.preventDefault()
                }
            }
        })

        // 创建 router-view 组件
        const self = this
        Vue.component("router-view", {
            render (h) {
                // 获取当前路由的路由组件
                // self.data.current 获取的是当前的路由
                // self.routeMap 存储着当前的路由规则
                const component = self.routeMap[self.data.current]
                return h(component)
            }
        })
    }

    initEvent () {
        window.addEventListener("popstate", () => {
            this.data.current = window.location.pathname
        })
    }
}