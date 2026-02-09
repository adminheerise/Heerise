# Hugo Universal Theme 组件手册

---

## 一、组件清单

主题包含 **20 个组件**（partial），分为 4 类：

### 页面骨架组件（每个页面都会用到）

| 组件 | 作用 |
|---|---|
| **headers.html** | 生成整个 `<head>` 标签的内容。包括：页面标题、SEO meta 标签、Open Graph 社交分享标签、Twitter Card 标签、Google Fonts 字体引入、Bootstrap CSS 引入、FontAwesome 图标库引入、Owl Carousel CSS 引入、主题颜色样式表引入、自定义 CSS 引入、Favicon 图标、RSS 订阅链接。所有页面的 CSS 都在这里加载。 |
| **custom_headers.html** | `<head>` 内的自定义注入点。主题提供的是一个空文件。你可以在站点目录创建同名文件来注入自己的 CSS 链接、JS 脚本、或任何需要放在 `<head>` 中的内容。这是你扩展页面头部的唯一入口。 |
| **scripts.html** | 在 `</body>` 关闭标签之前加载全部 JavaScript。按顺序加载：Google Analytics、jQuery、Bootstrap JS、jquery-cookie、Waypoints（滚动监测）、Counter-Up（数字动画）、jquery-parallax（视差滚动）、Google Maps JS（可选）、reCAPTCHA（可选）、主题核心脚本 front.js、Owl Carousel JS。所有页面的 JS 都在这里加载。 |
| **footer.html** | 页脚。三栏布局：左列是"关于我们"（HTML 内容），中列是"最近文章"（自动显示最近 3 篇博客），右列是"联系信息"（地址 HTML + 联系按钮）。下方还有版权信息栏。 |

### 导航组件

| 组件 | 作用 |
|---|---|
| **top.html** | 页面最顶部的窄条信息栏。分左右两部分：左侧显示一段自定义文字（比如联系邮箱、公告），右侧显示一排社交媒体图标链接（GitHub、邮箱、电话等）。可通过配置开关整体隐藏。 |
| **nav.html** | 主导航栏。左侧显示 Logo（图片或文字），右侧显示菜单链接。支持三种菜单形态：普通链接、下拉菜单（一列子菜单）、Mega Dropdown（多列大下拉，可带图片）。响应式设计，小屏自动变成汉堡菜单。当前页面的菜单项会自动高亮。 |
| **breadcrumbs.html** | 页面标题横幅。在页面正文区域上方显示一个带背景的横条，里面居中显示当前页面的标题（`<h1>`）。仅在非首页中使用。 |

### 首页内容组件（首页从上到下依次显示）

| 组件 | 作用 |
|---|---|
| **carousel.html** | 首页大轮播图。全宽显示，每一页分左右两部分：左侧显示标题和描述文字，右侧显示一张产品图片。使用 Owl Carousel 库实现自动轮播。数据来自 `data/carousel/` 目录下的 YAML 文件，每个文件是一页。可配置自动播放、切换速度。 |
| **features.html** | 特性展示卡片区。白色背景，以网格形式展示产品特性。每个特性是一个卡片：一个 FontAwesome 图标 + 标题 + 描述。可以配置每行显示 2、3、4 或 6 个。数据来自 `data/features/` 目录下的 YAML 文件。 |
| **testimonials.html** | 用户评价轮播区。深色五边形纹理背景，使用 Owl Carousel 横向轮播展示用户评价。每条评价包含：评价正文、用户头像、姓名、职位。数据来自 `data/testimonials/` 目录下的 YAML 文件。 |
| **see_more.html** | 行动号召（CTA）横幅。全宽固定背景图，深色遮罩，居中显示白色文字：一个大图标 + 标题 + 副标题 + 一个按钮。所有内容纯配置驱动，不需要数据文件。 |
| **recent_posts.html** | 最近博客文章区。白色背景，显示最近 4 篇博客文章的卡片。每张卡片包含：封面图片（鼠标悬停显示"阅读更多"按钮）、文章标题、作者、日期、摘要。数据自动从 `content/blog/` 目录读取，不需要手动维护。 |
| **clients.html** | 合作伙伴 Logo 轮播区。灰色背景，使用 Owl Carousel 横向轮播展示合作伙伴的 Logo。点击可跳转到合作伙伴网站。数据来自 `data/clients/` 目录下的 YAML 文件。 |

### 内容页组件

| 组件 | 作用 |
|---|---|
| **contact.html** | 联系页面的完整内容。分左右两部分：左侧（8列）显示 Markdown 页面文字 + 联系表单（姓名、邮箱、留言），右侧（4列）显示地址信息。底部自动嵌入 Google Maps 地图（可选）。表单通过 Formspree 服务提交。通过在 Markdown 文件的 front matter 中设置 `id = "contact"` 来激活。 |
| **page.html** | 通用页面内容渲染器。将 Markdown 内容居中显示（8列宽，两侧留白），下方可选显示 Disqus 评论。这是没有设置 `id` 的独立页面的默认渲染方式。 |
| **map.html** | Google Maps 地图嵌入。在联系页面底部显示一个交互式地图，标记你的位置。需要提供 Google Maps API Key 和经纬度坐标。由 contact.html 内部自动调用，通常不需要手动调用。 |

### 侧边栏组件（博客页面专用）

| 组件 | 作用 |
|---|---|
| **sidebar.html** | 侧边栏容器。不产生任何自身 HTML，仅按顺序调用下面三个 widget 组件。在博客列表页和博客文章页右侧显示。 |
| **widgets/search.html** | 搜索框。在侧边栏显示一个 Google 自定义搜索框，搜索范围限定为当前站点。 |
| **widgets/categories.html** | 分类列表。在侧边栏显示所有博客分类，每个分类后面带文章数量，如 "NEWS (2)"。当前分类高亮。 |
| **widgets/tags.html** | 标签云。在侧边栏显示所有博客标签，带标签图标。当前标签高亮。 |

---

## 二、布局模板（决定组件如何组装）

Hugo 有 5 个布局模板，自动根据页面类型选择。每个模板把上面的组件按固定顺序拼装：

### 首页模板 `index.html`

访问 `/` 时使用。

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 加载所有 CSS、meta 标签、SEO 标签 -->
    {{ partial "headers.html" . }}
    <!-- 你的自定义 head 内容（默认为空） -->
    {{ partial "custom_headers.html" . }}
  </head>
  <body>
    <div id="all">
        <!-- 顶部信息栏（邮箱/社交图标） -->
        {{ partial "top.html" . }}
        <!-- 主导航栏（Logo + 菜单） -->
        {{ partial "nav.html" . }}
        <!-- 大轮播图 -->
        {{ partial "carousel.html" . }}
        <!-- 特性卡片区 -->
        {{ partial "features.html" . }}
        <!-- 用户评价轮播 -->
        {{ partial "testimonials.html" . }}
        <!-- CTA 横幅 -->
        {{ partial "see_more.html" . }}
        <!-- 最近 4 篇博客 -->
        {{ partial "recent_posts.html" . }}
        <!-- 合作伙伴 Logo -->
        {{ partial "clients.html" . }}
        <!-- 页脚 -->
        {{ partial "footer.html" . }}
    </div>
    <!-- 加载所有 JS -->
    {{ partial "scripts.html" . }}
  </body>
</html>
```

### 独立页面模板 `page/single.html`

访问 `content/` 根目录下的 `.md` 文件时使用（如 `/contact/`、`/faq/`）。

**核心机制**：如果 Markdown front matter 中写了 `id = "xxx"`，就加载 `partials/xxx.html`；如果没写 `id`，就直接渲染 Markdown 内容。

```html
<body>
  <div id="all">
      <!-- 顶部信息栏 -->
      {{ partial "top.html" . }}
      <!-- 导航栏 -->
      {{ partial "nav.html" . }}
      <!-- 页面标题横幅 -->
      {{ partial "breadcrumbs.html" . }}

      <div id="content">
          <!-- 关键：根据 front matter 的 id 字段决定渲染什么 -->
          {{ if isset .Params "id" }}
            <!-- 有 id → 加载对应名称的 partial 组件 -->
            <!-- 例如 id="contact" → 加载 partials/contact.html -->
            {{ partial .Params.id . }}
          {{ else }}
            <!-- 没有 id → 直接渲染 Markdown 内容 -->
            <div class="container">
              {{ .Content }}
            </div>
          {{ end }}
      </div>

      <!-- 页脚 -->
      {{ partial "footer.html" . }}
  </div>
  <!-- JS -->
  {{ partial "scripts.html" . }}
</body>
```

### 博客列表模板 `_default/list.html`

访问 `/blog/`、`/categories/xxx/`、`/tags/xxx/` 时使用。

```html
<body>
  <!-- 顶部栏 + 导航 + 标题横幅 -->
  <div id="content">
    <div class="container">
      <div class="row">
        <!-- 左侧 9 列：文章列表（带分页） -->
        <div class="col-md-9">
          <!-- 遍历当前页的所有文章 -->
          <!-- 每篇文章显示：封面图(4列) + 标题/作者/日期/摘要(8列) -->
          <!-- 底部：分页导航 ← 更新 | 更旧 → -->
        </div>
        <!-- 右侧 3 列：侧边栏 -->
        <div class="col-md-3">
          {{ partial "sidebar.html" . }}
        </div>
      </div>
    </div>
  </div>
  <!-- 页脚 + JS -->
</body>
```

### 博客文章模板 `_default/single.html`

访问某篇博客文章时使用。

```html
<body>
  <!-- 顶部栏 + 导航 + 标题横幅 -->
  <div id="content">
    <div class="container">
      <div class="row">
        <!-- 左侧 9 列：文章正文 -->
        <div class="col-md-9" id="blog-post">
          <!-- 作者 + 日期 -->
          <!-- 文章 Markdown 正文 -->
          {{ .Content }}
          <!-- Disqus 评论（如配置） -->
        </div>
        <!-- 右侧 3 列：侧边栏 -->
        <div class="col-md-3">
          {{ partial "sidebar.html" . }}
        </div>
      </div>
    </div>
  </div>
  <!-- 页脚 + JS -->
</body>
```

### 404 模板 `404.html`

页面不存在时使用。显示错误提示和返回首页按钮。

---

## 三、逐个组件使用方法

以下对每个组件给出：**需要什么配置/文件** + **完整代码示例**。

---

### 1. headers.html

**你不需要手动调用它**，所有布局模板已自动包含。

**你能控制的**：在 `hugo.toml` 中设置这些值来影响 headers 的输出：

```toml
# ===== hugo.toml 中影响 headers.html 的配置 =====

[params]
  # 页面没有单独设置 keywords 时使用这些默认关键词
  defaultKeywords = ["heerise", "career", "coaching"]

  # 页面没有单独设置 description 时使用这个默认描述
  defaultDescription = "Heerise - Your Career Coach Platform"

  # 网站作者
  author = "Heerise Team"

  # 颜色主题，决定加载哪个 CSS 文件
  # 可选值: default, blue, green, marsala, pink, red, turquoise, violet
  style = "default"

  # 社交分享时的默认图片
  default_sharing_image = "img/sharing-default.png"

  # Facebook 和 Twitter 账号（用于社交标签）
  facebook_site = ""
  twitter_site = ""
```

**在单个页面中覆盖**：在 Markdown front matter 中设置：

```markdown
+++
title = "My Page Title"              # 覆盖 <title> 标签
description = "This page does..."    # 覆盖 meta description
keywords = ["custom", "keywords"]    # 追加到 defaultKeywords
banner = "img/banners/banner-1.jpg"  # 社交分享图片（Open Graph）
+++
```

---

### 2. custom_headers.html

**使用方法**：在站点目录创建文件 `layouts/partials/custom_headers.html`，写入你需要注入到 `<head>` 的内容。

**代码示例**：

```html
<!-- 文件路径: layouts/partials/custom_headers.html -->

<!-- 引入自定义 CSS -->
<link rel="stylesheet" href="/css/my-app.css">

<!-- 引入自定义 JS（defer 表示页面加载完再执行） -->
<script src="/js/api.js" defer></script>
<script src="/js/auth.js" defer></script>

<!-- 引入额外的字体 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap" rel="stylesheet">
```

---

### 3. scripts.html

**你不需要手动调用它**，所有布局模板已自动包含。

如果你需要添加自己的 JS，有两种方式：

**方式 A**：通过 custom_headers.html 添加（推荐）
```html
<!-- layouts/partials/custom_headers.html -->
<script src="/js/my-script.js" defer></script>
```

**方式 B**：覆盖 scripts.html（当你需要修改加载顺序时）
```html
<!-- 文件路径: layouts/partials/scripts.html -->

<!-- 复制主题原版 scripts.html 的全部内容 -->
{{ template "_internal/google_analytics.html" . }}
<script src="//code.jquery.com/jquery-3.1.1.min.js"></script>
<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/waypoints/4.0.1/jquery.waypoints.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/Counter-Up/1.0/jquery.counterup.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-parallax/1.1.3/jquery-parallax.js"></script>
<script src="{{ "js/front.js" | relURL }}"></script>
<script src="{{ "js/owl.carousel.min.js" | relURL }}"></script>

<!-- 在末尾加入你的脚本 -->
<script src="/js/my-app.js"></script>
```

---

### 4. top.html — 顶部信息栏

**显示效果**：页面最上方一条窄栏，左边文字右边图标。

**配置**：

```toml
# ===== hugo.toml =====

# ---------- 开关 ----------
[params.topbar]
  enable = true    # 设为 false 则整个顶部栏不显示
  # 左侧文字内容，支持 HTML
  text = """<p>联系我们 hello@heerise.com | 工作时间 Mon-Fri 9:00-18:00</p>"""

# ---------- 右侧社交图标 ----------
# 每个 [[menu.topbar]] 是一个图标链接，按 weight 排序

[[menu.topbar]]
  weight = 1                                       # 排序，数字小的在左
  name = "电话"                                     # 不显示，仅用于无障碍
  url = "tel:+8612345678901"                       # 点击执行的链接
  pre = "<i class='fas fa-2x fa-phone'></i>"       # 图标 HTML

[[menu.topbar]]
  weight = 2
  name = "GitHub"
  url = "https://github.com/adminheerise"
  pre = "<i class='fab fa-2x fa-github'></i>"

[[menu.topbar]]
  weight = 3
  name = "邮箱"
  url = "mailto:hello@heerise.com"
  pre = "<i class='fas fa-2x fa-envelope'></i>"
```

---

### 5. nav.html — 主导航栏

**显示效果**：Logo 在左，菜单链接在右，响应式。

**配置**：

```toml
# ===== hugo.toml =====

# ---------- Logo 设置 ----------
[params]
  disabled_logo = false          # false=显示图片Logo, true=显示文字Logo
  logo = "img/logo.png"         # 大屏幕 Logo 图片路径
  logo_small = "img/logo-small.png"  # 小屏幕 Logo 图片路径
  logo_text = "Heerise"         # 文字 Logo（仅当 disabled_logo=true 时显示）
  dropdown_mouse_over = false    # true=鼠标悬停打开下拉, false=点击打开

# ---------- 菜单项 ----------
# 每个 [[menu.main]] 是一个菜单链接，按 weight 从左到右排序

[[menu.main]]
  name       = "Home"            # 菜单上显示的文字
  identifier = "menu.home"       # 唯一标识符
  url        = "/"               # 点击跳转的链接
  weight     = 1                 # 排序

[[menu.main]]
  name       = "Blog"
  identifier = "menu.blog"
  url        = "/blog/"
  weight     = 2

[[menu.main]]
  name       = "FAQ"
  identifier = "menu.faq"
  url        = "/faq/"
  weight     = 3

[[menu.main]]
  name       = "Contact"
  identifier = "contact"
  url        = "/contact/"
  weight     = 4
```

**下拉菜单示例**（有子菜单时自动变为 dropdown）：

```toml
# 父菜单
[[menu.main]]
  name       = "Services"
  identifier = "services"
  url        = ""
  weight     = 5

# 子菜单（parent 指向父菜单的 identifier）
[[menu.main]]
  name       = "Career Coaching"
  parent     = "services"
  url        = "/services/coaching/"
  weight     = 1

[[menu.main]]
  name       = "Resume Review"
  parent     = "services"
  url        = "/services/resume/"
  weight     = 2
```

---

### 6. breadcrumbs.html — 页面标题横幅

**显示效果**：正文上方的横条，居中显示 `<h1>` 页面标题，有背景纹理。

**你不需要单独配置它**。它自动读取当前页面的 `.Title`（来自 Markdown front matter 的 `title` 字段）。

背景图片通过 CSS 控制。如需修改背景，在 `static/css/custom.css` 中覆盖：

```css
/* 文件路径: static/css/custom.css */

/* 修改标题横幅的背景图 */
#heading-breadcrumbs {
  background: url('/img/my-custom-banner.jpg') center center;
  background-size: cover;
}
```

---

### 7. carousel.html — 首页轮播图

**显示效果**：首页全宽轮播，左侧文字右侧图片，自动切换。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params.carouselHomepage]
  enable = true            # 开关
  auto_play = true         # 是否自动播放
  slide_speed = 2000       # 切换动画时长（毫秒）
  pagination_speed = 1000  # 点击分页圆点的动画时长
```

**第二步：创建数据文件**（每个文件 = 一页轮播）：

```yaml
# 文件路径: data/carousel/slide1.yaml

weight: 1                    # 排序，数字小的先显示
title: "欢迎来到 Heerise"     # 左侧大标题（支持 HTML）
description: >               # 左侧描述（支持 HTML）
  <ul class="list-style-none">
    <li>AI 驱动的职业规划</li>
    <li>个性化学习路径</li>
    <li>智能简历优化</li>
  </ul>
image: "img/carousel/template-easy-code.png"  # 右侧图片路径
href: "/contact/"            # 可选，点击整页轮播跳转到哪（不写则不可点击）
```

```yaml
# 文件路径: data/carousel/slide2.yaml

weight: 2
title: "发现你的职业方向"
description: >
  <ul class="list-style-none">
    <li>技能差距分析</li>
    <li>市场趋势洞察</li>
  </ul>
image: "img/carousel/template-homepage.png"
```

---

### 8. features.html — 特性卡片区

**显示效果**：白色背景，网格排列的图标卡片。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params.features]
  enable = true   # 开关
  cols = 3        # 每行显示几个卡片（可选: 2, 3, 4, 6）
```

**第二步：创建数据文件**（每个文件 = 一张卡片）：

```yaml
# 文件路径: data/features/coaching.yaml

weight: 1                    # 排序
name: "职业指导"              # 卡片标题
icon: "fas fa-user-tie"      # FontAwesome 图标 CSS 类名
description: "获得针对你职业方向的个性化建议和 AI 驱动的指导方案。"
url: ""                      # 可选，点击图标跳转的链接（空=不可点击）
```

```yaml
# 文件路径: data/features/analytics.yaml

weight: 2
name: "智能分析"
icon: "fas fa-chart-line"
description: "利用 AI 分析行业趋势，识别职业增长机会。"
url: "/services/analytics/"
```

```yaml
# 文件路径: data/features/learning.yaml

weight: 3
name: "持续学习"
icon: "fas fa-graduation-cap"
description: "获取与你职业目标对齐的个性化学习资源和技能发展路径。"
```

---

### 9. testimonials.html — 用户评价轮播

**显示效果**：深色背景，横向轮播的评价卡片。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params.testimonials]
  enable = true                  # 开关
  title = "用户评价"              # 区域标题
  subtitle = "听听用户怎么说"      # 区域副标题

[params.carouselTestimonials]
  items = 4              # 同时显示几条评价
  auto_play = false      # 是否自动播放
  slide_speed = 2000
  pagination_speed = 1000
```

**第二步：创建数据文件**（每个文件 = 一条评价）：

```yaml
# 文件路径: data/testimonials/1.yaml

text: "Heerise 帮助我从教育行业顺利转型到产品管理，AI 洞察非常精准！"
name: "Sarah Chen"
position: "产品经理, TechCorp"
avatar: "img/testimonials/person-1.jpg"   # 头像图片路径
```

```yaml
# 文件路径: data/testimonials/2.yaml

text: "通过 Heerise 的个性化指导，我在 3 个月内找到了理想的工作。"
name: "James Wilson"
position: "高级开发者, StartupXYZ"
avatar: "img/testimonials/person-2.jpg"
```

---

### 10. see_more.html — CTA 横幅

**显示效果**：全宽深色背景横幅，居中显示图标+标题+按钮。

**不需要数据文件，纯配置驱动**：

```toml
# ===== hugo.toml =====

[params.see_more]
  enable = true                                    # 开关
  icon = "far fa-file-alt"                         # FontAwesome 图标类名
  title = "想要了解更多？"                           # 大标题
  subtitle = "探索 Heerise 如何加速你的职业成长。"    # 副标题
  link_url = "/faq/"                               # 按钮点击跳转地址
  link_text = "了解更多"                             # 按钮文字
```

---

### 11. recent_posts.html — 最近博客

**显示效果**：白色背景，4 列博客卡片。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params]
  mainSections = ["blog"]        # 指定哪个 content 子目录是博客

[params.recent_posts]
  enable = true                  # 开关
  title = "最新博客"              # 区域标题
  subtitle = "职业发展最新洞察"    # 区域副标题
  hide_summary = false           # true=隐藏文章摘要, false=显示
```

**第二步：创建博客文章**（放在 `content/blog/` 下）：

```markdown
<!-- 文件路径: content/blog/welcome.md -->

+++
title = "欢迎来到 Heerise"
date = "2026-01-25"
tags = ["公告", "职业"]
categories = ["新闻"]
banner = "img/banners/banner-4.jpg"   # 卡片封面图
authors = ["Heerise Team"]
+++

这是文章摘要部分，会显示在卡片上。

<!--more-->

这是文章正文，点击"阅读更多"后才能看到。
```

---

### 12. clients.html — 合作伙伴 Logo 轮播

**显示效果**：灰色背景，Logo 横向滚动。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params.clients]
  enable = true                  # 开关
  title = "合作伙伴"              # 区域标题
  subtitle = ""                  # 区域副标题

[params.carouselCustomers]
  items = 6              # 同时显示几个 Logo
  auto_play = false
  slide_speed = 2000
  pagination_speed = 1000
```

**第二步：创建数据文件**（每个文件 = 一个合作伙伴）：

```yaml
# 文件路径: data/clients/partner1.yaml

name: "合作伙伴A"                       # 名称（鼠标悬停提示文字）
image: "img/clients/customer-1.png"    # Logo 图片路径
url: "https://partner-a.com"          # 可选，点击跳转（不写则不可点击）
```

---

### 13. contact.html — 联系表单页

**显示效果**：左侧联系表单 + 右侧地址信息 + 底部可选地图。

**第一步：在 hugo.toml 中配置**：

```toml
# ===== hugo.toml =====

[params]
  # Formspree 表单提交地址（不设置则不显示表单）
  formspree_action = "https://formspree.io/f/你的ID"
  contact_form_ajax = false               # true=AJAX提交不刷新页面
  enableRecaptchaInContactForm = false     # true=启用验证码
  googleRecaptchaKey = ""

  # 右侧地址信息（支持 HTML）
  address = """<p class="text-uppercase"><strong>Heerise</strong>
    <br>Your Career Coach
    <br><strong>Online Platform</strong>
  </p>"""

  # Google Maps（可选）
  enableGoogleMaps = false
  googleMapsApiKey = ""
  latitude = ""
  longitude = ""
```

**第二步：创建内容文件**（`id = "contact"` 是关键）：

```markdown
<!-- 文件路径: content/contact.md -->

+++
title = "联系我们"
id = "contact"
+++

如有任何问题，欢迎通过以下表单联系我们，我们的团队会在 24 小时内回复。
```

> `id = "contact"` 告诉 Hugo：这个页面不要用默认的 Markdown 渲染，而是加载 `partials/contact.html` 组件。

---

### 14. page.html — 通用页面内容

**显示效果**：居中显示 Markdown 内容（约占页面 2/3 宽度）。

**使用方法**：创建一个不带 `id` 的 Markdown 文件即可自动使用：

```markdown
<!-- 文件路径: content/faq.md -->

+++
title = "常见问题"
description = "Frequently asked questions"
+++

## Heerise 是什么？

Heerise 是一个 AI 驱动的职业规划平台。

## 如何开始使用？

注册账号，完成问卷，我们会为你推荐个性化的职业资源。

## Heerise 收费吗？

我们提供免费基础功能，高级功能需要订阅。
```

也可以显式设置 `id = "page"` 来使用这个组件（效果一样）。

---

### 15. map.html — Google 地图

**你通常不需要直接调用它**。它由 contact.html 内部自动调用。

配置方式见上面 contact.html 的 `enableGoogleMaps`、`googleMapsApiKey`、`latitude`、`longitude`。

---

### 16. footer.html — 页脚

**你不需要手动调用它**，所有布局模板已自动包含。

**配置**：

```toml
# ===== hugo.toml =====

[params]
  # 左列：关于我们（支持 HTML）
  about_us = "<p>Heerise 是你的 AI 职业规划伙伴，帮助你发现职业方向、提升技能、获得工作。</p>"

  # 右列：联系地址（支持 HTML）
  address = """<p class="text-uppercase"><strong>Heerise</strong>
    <br>Your Career Coach
    <br><strong>Online Platform</strong>
  </p>"""

  # 右列：联系按钮跳转地址
  contact_url = "/contact"

  # 底部版权文字（支持 HTML）
  copyright = "Copyright (c) 2025 - 2026, Heerise. All rights reserved."

# 中列：是否显示最近 3 篇博客文章
[params.footer.recent_posts]
  enable = true
```

---

### 17. sidebar.html — 侧边栏

**你不需要手动调用它**。博客列表页和博客文章页自动在右侧显示。

它内部按顺序调用 search、categories、tags 三个 widget，每个可独立开关：

```toml
# ===== hugo.toml =====

[params.widgets]
  search = true       # 搜索框
  categories = true   # 分类列表
  tags = true         # 标签云
```

---

### 18-20. 侧边栏三个 widget

由 sidebar.html 自动调用，开关见上方 `[params.widgets]`。不需要单独操作。

---

## 四、如何创建自定义页面

这是你最需要掌握的能力：利用主题的 `id` 分发机制创建任何自定义页面。

**需要创建 3 个文件**：

### 文件 1：内容文件（定义页面 URL 和元数据）

```markdown
<!-- 文件路径: content/login.md -->
<!-- 作用：告诉 Hugo 这个页面存在，URL 是 /login/ -->

+++
title = "登录"
id = "login"
+++
```

### 文件 2：HTML 模板（定义页面长什么样）

```html
<!-- 文件路径: layouts/partials/login.html -->
<!-- 作用：定义登录页面的 HTML 结构 -->
<!-- 注意：导航栏、页脚、CSS、JS 已由布局模板自动包含，这里只写页面内容区 -->

<div class="container">
  <div class="row">
    <!-- 居中显示，占 6 列（共 12 列），左偏移 3 列 -->
    <div class="col-md-6 col-md-offset-3">

      <!-- 登录卡片 -->
      <div class="box" style="margin-top: 30px; padding: 30px;">
        <h2 class="text-center">登录</h2>

        <!-- 登录表单 -->
        <form id="login-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" class="form-control" id="email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" class="form-control" id="password" placeholder="输入密码" required>
          </div>

          <!-- 使用主题自带的按钮样式 -->
          <button type="submit" class="btn btn-template-main btn-lg btn-block">
            <i class="fas fa-sign-in-alt"></i> 登录
          </button>
        </form>

        <!-- 错误提示（默认隐藏，JS 控制显示） -->
        <div id="login-error" class="alert alert-danger" style="display:none; margin-top:15px;"></div>

        <!-- 底部链接 -->
        <p class="text-center" style="margin-top: 20px;">
          还没有账号？<a href="/register/">注册</a>
        </p>
      </div>

    </div>
  </div>
</div>

<!-- 加载这个页面专用的 JS -->
<script src="/js/auth.js"></script>
```

### 文件 3：JavaScript（定义页面行为）

```javascript
// 文件路径: static/js/auth.js
// 作用：处理登录表单提交，调用后端 API，管理 token

// 后端 API 地址（本地开发时）
var API_BASE = "http://localhost:8000";

// 监听表单提交
document.getElementById("login-form").addEventListener("submit", function(e) {
  // 阻止表单默认跳转行为
  e.preventDefault();

  // 获取输入值
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  // 隐藏之前的错误提示
  var errorEl = document.getElementById("login-error");
  errorEl.style.display = "none";

  // 调用后端登录 API
  fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) {
        // 登录失败，显示错误
        throw new Error(data.detail || "登录失败");
      }
      // 登录成功，保存 token
      localStorage.setItem("access", data.access_token);
      localStorage.setItem("refresh", data.refresh_token);
      // 跳转到 Dashboard
      window.location.href = "/dashboard/";
    });
  })
  .catch(function(err) {
    // 显示错误提示
    errorEl.textContent = err.message;
    errorEl.style.display = "block";
  });
});
```

### 完整渲染流程

当用户访问 `http://localhost:1313/login/` 时：

```
1. Hugo 找到 content/login.md → 使用 page/single.html 模板
2. 模板加载 headers.html → 所有 CSS 就绪（Bootstrap + 主题 + 你的 custom.css）
3. 模板加载 top.html → 显示顶部信息栏
4. 模板加载 nav.html → 显示导航栏（Logo + Home/Blog/FAQ/Contact）
5. 模板加载 breadcrumbs.html → 显示 "登录" 标题横幅
6. 模板发现 id="login" → 加载 partials/login.html → 显示你的登录表单
7. 模板加载 footer.html → 显示页脚
8. 模板加载 scripts.html → jQuery/Bootstrap 等 JS 就绪
9. login.html 底部的 <script src="/js/auth.js"> → 你的登录逻辑就绪
```

**所有页面自动拥有统一的导航栏、页脚、CSS 主题**，你只需要关注页面内容区域的 HTML 和 JS。

---

## 五、覆盖主题文件的规则

Hugo 的查找顺序：**你的站点文件优先于主题文件**。

要修改任何主题自带的组件，在你的站点目录中创建相同路径的文件：

| 你想修改什么 | 创建这个文件 |
|---|---|
| 首页组件排列顺序 | `layouts/index.html` |
| 导航栏 | `layouts/partials/nav.html` |
| 页脚 | `layouts/partials/footer.html` |
| head 注入内容 | `layouts/partials/custom_headers.html` |
| 自定义样式 | `static/css/custom.css` |
| 翻译文字 | `i18n/en.yaml` |

**规则：永远不要直接编辑 `themes/` 目录下的任何文件。**

---

## 六、CSS 颜色主题

在 `hugo.toml` 中设置 `params.style` 切换颜色：

| 值 | 主色调 |
|---|---|
| `"default"` | 浅蓝 |
| `"blue"` | 蓝 |
| `"green"` | 绿 |
| `"marsala"` | 暗红 |
| `"pink"` | 粉 |
| `"red"` | 红 |
| `"turquoise"` | 青绿 |
| `"violet"` | 紫 |

自定义样式写在 `static/css/custom.css`，它在所有主题 CSS 之后加载，优先级最高。

---

## 七、常用 CSS 类名

在自定义页面中可以直接使用以下主题提供的 CSS 类：

```html
<!-- 按钮 -->
<button class="btn btn-template-main">主色调按钮</button>
<button class="btn btn-template-main btn-lg">大号按钮</button>
<button class="btn btn-template-main btn-lg btn-block">全宽大号按钮</button>

<!-- 表单 -->
<div class="form-group">
  <label for="x">标签</label>
  <input type="text" class="form-control" id="x">
</div>

<!-- 提示框 -->
<div class="alert alert-danger">错误提示</div>
<div class="alert alert-success">成功提示</div>
<div class="alert alert-info">信息提示</div>

<!-- 布局（Bootstrap 3 栅格） -->
<div class="container">           <!-- 居中容器，最大宽度 1170px -->
  <div class="row">               <!-- 行 -->
    <div class="col-md-6">内容</div>  <!-- 6列（一半宽度） -->
    <div class="col-md-6">内容</div>
  </div>
</div>

<!-- 卡片容器 -->
<div class="box" style="padding: 30px;">卡片内容</div>
<div class="box-simple">图标卡片（features 用的样式）</div>

<!-- 区域标题 -->
<div class="heading text-center">
  <h2>区域标题</h2>
</div>

<!-- 背景区域 -->
<section class="bar background-white">白色背景区域</section>
<section class="bar background-gray">灰色背景区域</section>
```
