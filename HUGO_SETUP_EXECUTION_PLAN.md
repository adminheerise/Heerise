# Hugo Universal Theme - 完整执行计划 / Full Execution Plan

> **用途 / Purpose**: 本文档是一份精确的逐步执行指令，用于在 Heerise 项目中部署 hugo-universal-theme 并撰写详细文档。
> 请严格按照步骤顺序执行，不要跳步。
>
> This document is a precise step-by-step execution guide for deploying hugo-universal-theme
> in the Heerise project and writing comprehensive documentation. Follow steps in order.

---

## 背景 / Background

- **当前项目**: Heerise (CareerCoach MVP), 前端 Next.js 14 + 后端 FastAPI
- **目标**: 在 `frontend/hugo-landing/` 目录下部署 hugo-universal-theme 的完整示例站点，不影响现有 Next.js 前端
- **hugo-universal-theme**: 纯前端静态站点主题，基于 Bootstrap 3，无任何后端代码
- **文档语言**: 中英双语

---

## 第一步: 检查/安装 Hugo / Step 1: Check/Install Hugo

在终端中执行以下命令检查 Hugo 是否已安装:

```powershell
hugo version
```

**如果未安装**, 使用以下任意一种方式安装:

方式 A - Chocolatey (推荐):
```powershell
choco install hugo-extended
```

方式 B - Scoop:
```powershell
scoop install hugo-extended
```

方式 C - 手动下载:
从 https://github.com/gohugoio/hugo/releases 下载最新的 `hugo_extended_*_windows-amd64.zip`，解压后将 `hugo.exe` 放入系统 PATH 目录中。

安装后验证:
```powershell
hugo version
```

应该看到类似 `hugo v0.139.x+extended` 的输出。

---

## 第二步: 创建 Hugo 站点目录结构 / Step 2: Create Hugo Site Structure

```powershell
cd E:\Heerise\frontend
mkdir hugo-landing
cd hugo-landing
mkdir content
mkdir content\blog
mkdir data
mkdir data\carousel
mkdir data\features
mkdir data\testimonials
mkdir data\clients
mkdir static
mkdir static\css
mkdir static\img
mkdir static\img\banners
mkdir static\img\carousel
mkdir static\img\clients
mkdir static\img\testimonials
mkdir themes
```

---

## 第三步: 克隆主题 / Step 3: Clone the Theme

```powershell
cd E:\Heerise\frontend\hugo-landing\themes
git clone https://github.com/devcows/hugo-universal-theme.git hugo-universal-theme
```

---

## 第四步: 创建站点配置文件 / Step 4: Create Site Configuration

创建文件 `E:\Heerise\frontend\hugo-landing\hugo.toml`，内容如下:

```toml
baseurl = "http://localhost:1313/"
title = "Heerise"
theme = "hugo-universal-theme"
languageCode = "en-us"
defaultContentLanguage = "en"

# number of words of summarized post content (default 70)
summaryLength = 70

# not pluralize title pages by default
pluralizelisttitles = false

[services]
  [services.disqus]
  shortname = ""
  [services.googleAnalytics]
  id = ""

[pagination]
  pagerSize = 10

# ============================================================
# Main Menu
# ============================================================
[menu]
[[menu.main]]
  name       = "Home"
  identifier = "menu.home"
  url        = "/"
  weight     = 1

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
  identifier = "contact"
  name       = "Contact"
  url        = "/contact/"
  weight     = 4

# Top bar social links
[[menu.topbar]]
  weight = 1
  name   = "Phone"
  url    = "tel:+12 34 567 89 01"
  pre    = "<i class='fas fa-2x fa-phone'></i>"

[[menu.topbar]]
  weight = 2
  name   = "GitHub"
  url    = "https://github.com"
  pre    = "<i class='fab fa-2x fa-github'></i>"

[[menu.topbar]]
  weight = 3
  name   = "Email"
  url    = "mailto:hello@heerise.com"
  pre    = "<i class='fas fa-2x fa-envelope'></i>"

# ============================================================
# Site Params
# ============================================================
[params]
  viewMorePostLink = "/blog/"
  author = "Heerise Team"
  defaultKeywords = ["heerise", "career", "coaching"]
  mainSections = ["blog"]
  defaultDescription = "Heerise - Your Career Coach Platform"

  # Social media
  facebook_site = ""
  twitter_site = ""
  default_sharing_image = "img/sharing-default.png"

  # Google Maps (disabled by default)
  enableGoogleMaps = false
  googleMapsApiKey = ""

  latitude = ""
  longitude = ""

  # Style: default (light-blue), blue, green, marsala, pink, red, turquoise, violet
  style = "default"

  # Contact form (Formspree)
  formspree_action = ""
  contact_form_ajax = false
  enableRecaptchaInContactForm = false
  googleRecaptchaKey = ""

  about_us = "<p>Heerise is your AI-powered career coaching platform.</p>"
  copyright = "Copyright (c) 2025 - 2026, Heerise. All rights reserved."

  date_format = "January 2, 2006"

  dropdown_mouse_over = false

  disabled_logo = false
  logo_text = "Heerise"

  logo = "img/logo.png"
  logo_small = "img/logo-small.png"
  contact_url = "/contact"
  address = """<p class="text-uppercase"><strong>Heerise</strong>
    <br>Your Career Coach
    <br><strong>Online Platform</strong>
  </p>
  """

[permalinks]
  blog = "/blog/:year/:month/:day/:contentbasename/"

# Top bar
[params.topbar]
  enable = true
  text = """<p>Contact us at hello@heerise.com</p>"""

# Sidebar widgets
[params.widgets]
  categories = true
  tags = true
  search = true

# Carousel settings
[params.carouselCustomers]
  items = 6
  auto_play = false
  slide_speed = 2000
  pagination_speed = 1000

[params.carouselTestimonials]
  items = 4
  auto_play = false
  slide_speed = 2000
  pagination_speed = 1000

[params.carouselHomepage]
  enable = true
  auto_play = true
  slide_speed = 2000
  pagination_speed = 1000

# Features section
[params.features]
  enable = true
  cols = 3

# Testimonials section
[params.testimonials]
  enable = true
  title = "Testimonials"
  subtitle = "Hear from our users about their career transformation journey."

# See more section
[params.see_more]
  enable = true
  icon = "far fa-file-alt"
  title = "Do you want to see more?"
  subtitle = "Explore how Heerise can accelerate your career growth."
  link_url = "#"
  link_text = "Learn More"

# Clients section
[params.clients]
  enable = true
  title = "Our Partners"
  subtitle = ""

# Recent posts section
[params.recent_posts]
  enable = true
  title = "From our blog"
  subtitle = "Latest insights on career development and professional growth."
  hide_summary = false

[params.footer.recent_posts]
  enable = true

[taxonomies]
  category = "categories"
  tag = "tags"
  author = "authors"
```

---

## 第五步: 创建示例内容文件 / Step 5: Create Example Content Files

### 5.1 Contact 页面

创建文件 `E:\Heerise\frontend\hugo-landing\content\contact.md`:

```markdown
+++
title = "Contact"
id = "contact"
+++

We'd love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
```

### 5.2 FAQ 页面

创建文件 `E:\Heerise\frontend\hugo-landing\content\faq.md`:

```markdown
+++
title = "FAQ"
description = "Frequently asked questions"
keywords = ["FAQ", "How do I", "questions", "what if"]
+++

## What is Heerise?

Heerise is an AI-powered career coaching platform that helps you navigate your professional journey.

## How do I get started?

Simply create an account, complete the onboarding questionnaire, and we'll match you with personalized career resources.

## Is Heerise free?

We offer a free tier with basic features. Premium plans are available for advanced career coaching tools.
```

### 5.3 示例博客文章

创建文件 `E:\Heerise\frontend\hugo-landing\content\blog\first-post.md`:

```markdown
+++
title = "Welcome to Heerise"
date = "2026-01-25"
tags = ["career", "announcement"]
categories = ["news"]
banner = "img/banners/banner-4.jpg"
authors = ["Heerise Team"]
+++

Welcome to Heerise! We are excited to launch our career coaching platform. Stay tuned for more updates on how we can help you achieve your career goals.

<!--more-->

Our platform combines AI-powered insights with personalized coaching to help professionals at every stage of their career journey. Whether you're just starting out or looking to make a career transition, Heerise has the tools and resources you need.
```

创建文件 `E:\Heerise\frontend\hugo-landing\content\blog\career-tips.md`:

```markdown
+++
title = "5 Tips for Career Growth in 2026"
date = "2026-01-20"
tags = ["career", "tips", "growth"]
categories = ["advice"]
banner = "img/banners/banner-4.jpg"
authors = ["Heerise Team"]
+++

Looking to accelerate your career in 2026? Here are five actionable tips to help you grow professionally.

<!--more-->

1. **Invest in Continuous Learning** - The job market evolves rapidly. Stay relevant by learning new skills.
2. **Build Your Network** - Connections open doors to opportunities you might never find on your own.
3. **Seek Mentorship** - A good mentor can provide invaluable guidance and perspective.
4. **Set Clear Goals** - Define what success looks like for you and create a roadmap to get there.
5. **Embrace AI Tools** - Leverage AI-powered platforms like Heerise to get personalized career insights.
```

---

## 第六步: 创建数据文件 / Step 6: Create Data Files

### 6.1 Carousel 数据

创建文件 `E:\Heerise\frontend\hugo-landing\data\carousel\welcome.yaml`:

```yaml
weight: 1
title: "Welcome to Heerise"
description: >
  <ul class="list-style-none">
    <li>AI-powered career coaching</li>
    <li>Personalized growth plans</li>
  </ul>
image: "img/carousel/template-easy-code.png"
href: "#"
```

创建文件 `E:\Heerise\frontend\hugo-landing\data\carousel\features.yaml`:

```yaml
weight: 2
title: "Smart Career Insights"
description: >
  <ul class="list-style-none">
    <li>Data-driven recommendations</li>
    <li>Industry trend analysis</li>
  </ul>
image: "img/carousel/template-easy-code.png"
href: "#"
```

### 6.2 Features 数据

创建文件 `E:\Heerise\frontend\hugo-landing\data\features\coaching.yaml`:

```yaml
weight: 1
name: "Career Coaching"
icon: "fas fa-user-tie"
url: ""
description: "Get personalized career advice and coaching tailored to your unique professional journey."
```

创建文件 `E:\Heerise\frontend\hugo-landing\data\features\analytics.yaml`:

```yaml
weight: 2
name: "Smart Analytics"
icon: "fas fa-chart-line"
url: ""
description: "Leverage AI-powered analytics to understand industry trends and identify growth opportunities."
```

创建文件 `E:\Heerise\frontend\hugo-landing\data\features\learning.yaml`:

```yaml
weight: 3
name: "Continuous Learning"
icon: "fas fa-graduation-cap"
url: ""
description: "Access curated learning resources and skill development paths aligned with your career goals."
```

### 6.3 Testimonials 数据

创建文件 `E:\Heerise\frontend\hugo-landing\data\testimonials\1.yaml`:

```yaml
text: "Heerise helped me transition from engineering to product management seamlessly. The AI-powered insights were spot on!"
name: "Sarah Chen"
position: "Product Manager, TechCorp"
avatar: "img/testimonials/person-1.jpg"
```

创建文件 `E:\Heerise\frontend\hugo-landing\data\testimonials\2.yaml`:

```yaml
text: "The personalized career coaching I received through Heerise was invaluable. I landed my dream job within 3 months."
name: "James Wilson"
position: "Senior Developer, StartupXYZ"
avatar: "img/testimonials/person-1.jpg"
```

### 6.4 Clients 数据

创建文件 `E:\Heerise\frontend\hugo-landing\data\clients\1.yaml`:

```yaml
name: "partner-1"
image: "img/clients/customer-1.png"
url: "#"
```

创建文件 `E:\Heerise\frontend\hugo-landing\data\clients\2.yaml`:

```yaml
name: "partner-2"
image: "img/clients/customer-2.png"
url: "#"
```

---

## 第七步: 复制主题自带的图片资源 / Step 7: Copy Theme Image Assets

从克隆的主题 exampleSite 中复制图片资源:

```powershell
cd E:\Heerise\frontend\hugo-landing

# 复制 exampleSite 的图片到我们的 static 目录
Copy-Item -Recurse "themes\hugo-universal-theme\exampleSite\static\img\*" "static\img\" -Force

# 复制 exampleSite 的自定义 CSS
Copy-Item -Recurse "themes\hugo-universal-theme\exampleSite\static\css\*" "static\css\" -Force
```

---

## 第八步: 本地运行验证 / Step 8: Run and Verify Locally

```powershell
cd E:\Heerise\frontend\hugo-landing
hugo server -w
```

应该看到类似输出:
```
Web Server is available at http://localhost:1313/
Press Ctrl+C to stop
```

在浏览器中打开 http://localhost:1313/ 验证页面正常显示。

**验证清单 / Verification Checklist:**
- [ ] 首页加载，显示 carousel 轮播
- [ ] Features 区域显示 3 个特性卡片
- [ ] Testimonials 区域显示用户评价
- [ ] 导航菜单正常工作
- [ ] Blog 页面可以访问
- [ ] Contact 页面可以访问
- [ ] FAQ 页面可以访问

验证完成后 `Ctrl+C` 停止服务器。

---

## 第九步: 编写详细 README 文档 / Step 9: Write Comprehensive README

创建文件 `E:\Heerise\frontend\hugo-landing\HUGO_THEME_README.md`，内容如下:

```markdown
# Hugo Universal Theme - 完整使用指南 / Complete Usage Guide

> **hugo-universal-theme** 是一个基于 Bootstrap 3 的 Hugo 静态站点主题，具有简洁的设计和优雅的排版。
>
> **hugo-universal-theme** is a Hugo static site theme built on Bootstrap 3, featuring clean design and elegant typography.

---

## 目录 / Table of Contents

1. [项目结构 / Project Structure](#项目结构--project-structure)
2. [技术栈 / Tech Stack](#技术栈--tech-stack)
3. [快速开始 / Quick Start](#快速开始--quick-start)
4. [配置详解 / Configuration Reference](#配置详解--configuration-reference)
5. [组件详解 / Component Reference](#组件详解--component-reference)
   - [页面结构组件 / Page Structure Components](#页面结构组件--page-structure-components)
   - [导航组件 / Navigation Components](#导航组件--navigation-components)
   - [落地页组件 / Landing Page Components](#落地页组件--landing-page-components)
   - [内容页组件 / Content Page Components](#内容页组件--content-page-components)
   - [侧边栏组件 / Sidebar Widgets](#侧边栏组件--sidebar-widgets)
6. [数据文件格式 / Data File Schemas](#数据文件格式--data-file-schemas)
7. [CSS 主题变体 / CSS Theme Variants](#css-主题变体--css-theme-variants)
8. [国际化 / i18n Support](#国际化--i18n-support)
9. [自定义组件 / Creating Custom Components](#自定义组件--creating-custom-components)
10. [覆盖主题文件 / Overriding Theme Files](#覆盖主题文件--overriding-theme-files)
11. [与 FastAPI 后端集成 / Integrating with FastAPI Backend](#与-fastapi-后端集成--integrating-with-fastapi-backend)

---

## 项目结构 / Project Structure

```
frontend/hugo-landing/
├── hugo.toml                          # 站点配置 / Site configuration
├── content/                           # 页面内容 (Markdown) / Page content
│   ├── blog/                          # 博客文章 / Blog posts
│   │   ├── first-post.md
│   │   └── career-tips.md
│   ├── contact.md                     # 联系页面 / Contact page
│   └── faq.md                         # FAQ 页面
├── data/                              # 数据驱动组件的 YAML 文件 / YAML data for components
│   ├── carousel/                      # 轮播图数据 / Carousel slides
│   ├── features/                      # 特性卡片数据 / Feature cards
│   ├── testimonials/                  # 用户评价数据 / Testimonials
│   └── clients/                       # 合作伙伴数据 / Client logos
├── static/                            # 静态资源 / Static assets
│   ├── css/custom.css                 # 自定义 CSS 覆盖 / Custom CSS overrides
│   └── img/                           # 图片资源 / Images
│       ├── logo.png
│       ├── banners/
│       ├── carousel/
│       ├── clients/
│       └── testimonials/
├── themes/
│   └── hugo-universal-theme/          # 主题 (git clone) / Theme (git cloned)
│       ├── layouts/                   # HTML 模板 / HTML templates
│       │   ├── index.html             # 首页模板 / Homepage template
│       │   ├── 404.html               # 404 页面 / 404 page
│       │   ├── _default/
│       │   │   ├── list.html          # 列表页模板 / List page template
│       │   │   └── single.html        # 单页模板 / Single page template
│       │   ├── page/
│       │   │   └── single.html        # 独立页面模板 / Standalone page template
│       │   └── partials/              # ★ 可复用组件 / ★ Reusable components
│       │       ├── headers.html       # HTML <head> 元信息
│       │       ├── custom_headers.html # 自定义 <head> 内容
│       │       ├── scripts.html       # JS 脚本加载
│       │       ├── breadcrumbs.html   # 面包屑导航
│       │       ├── top.html           # 顶部社交栏
│       │       ├── nav.html           # 主导航菜单
│       │       ├── carousel.html      # 轮播图
│       │       ├── features.html      # 特性展示
│       │       ├── testimonials.html  # 用户评价
│       │       ├── see_more.html      # "查看更多" CTA
│       │       ├── recent_posts.html  # 最近博客
│       │       ├── clients.html       # 合作伙伴
│       │       ├── contact.html       # 联系表单
│       │       ├── map.html           # Google 地图
│       │       ├── page.html          # 页面内容区
│       │       ├── sidebar.html       # 侧边栏容器
│       │       ├── footer.html        # 页脚
│       │       └── widgets/           # 侧边栏小部件
│       │           ├── search.html
│       │           ├── categories.html
│       │           └── tags.html
│       ├── static/                    # 主题静态资源
│       │   ├── css/                   # 样式表 (8 种颜色主题)
│       │   ├── js/                    # JavaScript 脚本
│       │   └── img/                   # 主题默认图片
│       └── i18n/                      # 22 种语言翻译文件
└── HUGO_THEME_README.md               # 本文档 / This document
```

---

## 技术栈 / Tech Stack

| 技术 / Technology | 版本 / Version | 用途 / Purpose |
|---|---|---|
| Hugo | 0.139+ (extended) | 静态站点生成器 / Static site generator |
| Bootstrap | 3.4.x | CSS 框架 / CSS framework |
| jQuery | 1.11.0 | DOM 操作 / DOM manipulation |
| Owl Carousel | 1.x | 轮播图/滑动 / Carousel/slider |
| FontAwesome | 5.x | 图标库 / Icon library |
| Animate.css | 3.x | CSS 动画 / CSS animations |
| Waypoints | - | 滚动触发动画 / Scroll-triggered animations |

**CDN 依赖 (在 `headers.html` 和 `scripts.html` 中加载):**
- Bootstrap CSS & JS via CDN
- FontAwesome via CDN
- jQuery via CDN

---

## 快速开始 / Quick Start

```bash
# 1. 进入 Hugo 站点目录 / Enter Hugo site directory
cd E:\Heerise\frontend\hugo-landing

# 2. 启动开发服务器 / Start dev server
hugo server -w

# 3. 浏览器访问 / Open in browser
# http://localhost:1313/

# 4. 构建静态文件 / Build static files (for production)
hugo --minify
# 输出到 public/ 目录 / Output to public/ directory
```

---

## 配置详解 / Configuration Reference

所有配置在 `hugo.toml` 文件中。以下是关键配置项:

All configuration lives in `hugo.toml`. Key settings:

### 基础设置 / Basic Settings

| 配置项 / Key | 说明 / Description | 示例 / Example |
|---|---|---|
| `baseurl` | 站点根 URL / Site root URL | `"http://localhost:1313/"` |
| `title` | 站点标题 / Site title | `"Heerise"` |
| `theme` | 主题名称 / Theme name | `"hugo-universal-theme"` |
| `defaultContentLanguage` | 默认语言 / Default language | `"en"` 或 `"zh"` |
| `summaryLength` | 摘要字数 / Summary word count | `70` |

### 样式设置 / Style Settings

| 配置项 / Key | 说明 / Description | 可选值 / Options |
|---|---|---|
| `params.style` | 颜色主题 / Color theme | `default`, `blue`, `green`, `marsala`, `pink`, `red`, `turquoise`, `violet` |
| `params.disabled_logo` | 禁用 Logo 图片 / Disable logo image | `true` / `false` |
| `params.logo` | Logo 图片路径 / Logo image path | `"img/logo.png"` |
| `params.logo_small` | 小屏 Logo / Small screen logo | `"img/logo-small.png"` |
| `params.logo_text` | 文字 Logo / Text logo (when image disabled) | `"Heerise"` |

### 组件开关 / Component Toggles

| 配置项 / Key | 说明 / Description |
|---|---|
| `params.carouselHomepage.enable` | 首页轮播图 / Homepage carousel |
| `params.features.enable` | 特性区域 / Features section |
| `params.testimonials.enable` | 评价区域 / Testimonials section |
| `params.see_more.enable` | "查看更多" 区域 / See more section |
| `params.clients.enable` | 合作伙伴区域 / Clients section |
| `params.recent_posts.enable` | 最近博客 / Recent posts |
| `params.topbar.enable` | 顶部信息栏 / Top bar |
| `params.widgets.search` | 搜索小部件 / Search widget |
| `params.widgets.categories` | 分类小部件 / Categories widget |
| `params.widgets.tags` | 标签小部件 / Tags widget |

---

## 组件详解 / Component Reference

### 首页组件调用顺序 / Homepage Component Call Order

首页模板 (`layouts/index.html`) 按以下顺序调用 partial 组件:

The homepage template calls partials in this order:

```
1. {{ partial "headers.html" . }}         ← HTML <head>
2. {{ partial "custom_headers.html" . }}  ← 自定义 <head> 内容
3. {{ partial "top.html" . }}             ← 顶部社交信息栏
4. {{ partial "nav.html" . }}             ← 主导航菜单
5. {{ partial "carousel.html" . }}        ← 轮播图 (数据来自 data/carousel/)
6. {{ partial "features.html" . }}        ← 特性展示 (数据来自 data/features/)
7. {{ partial "testimonials.html" . }}    ← 用户评价 (数据来自 data/testimonials/)
8. {{ partial "see_more.html" . }}        ← CTA "查看更多"
9. {{ partial "recent_posts.html" . }}    ← 最近博客文章
10.{{ partial "clients.html" . }}         ← 合作伙伴 (数据来自 data/clients/)
11.{{ partial "footer.html" . }}          ← 页脚
12.{{ partial "scripts.html" . }}         ← JS 脚本
```

每个组件都可以通过 `hugo.toml` 中对应的 `enable` 参数独立开关。

Each component can be individually toggled via its `enable` param in `hugo.toml`.

---

### 页面结构组件 / Page Structure Components

#### headers.html
- **功能 / Purpose**: 生成 `<head>` 标签内容，包括 meta 标签、SEO、Open Graph、Twitter Card、CSS 引入
- **数据来源 / Data source**: `hugo.toml` 中的 `params.defaultKeywords`, `params.defaultDescription`, `params.style`
- **可覆盖 / Overridable**: 每个页面可通过 front matter 覆盖 `title`, `description`, `keywords`, `banner`

#### custom_headers.html
- **功能 / Purpose**: 空文件，用于添加自定义 `<head>` 内容（额外 CSS/JS）
- **使用方法 / Usage**: 在你的站点中创建 `layouts/partials/custom_headers.html` 即可覆盖

#### scripts.html
- **功能 / Purpose**: 加载所有 JS 依赖 (jQuery, Bootstrap, Owl Carousel, front.js, Google Maps, reCAPTCHA)
- **条件加载 / Conditional**: Google Maps JS 仅在 `enableGoogleMaps = true` 时加载

#### breadcrumbs.html
- **功能 / Purpose**: 页面顶部面包屑导航和标题横幅
- **样式 / Style**: 背景图 `img/banner.jpg`，白色文字叠加

---

### 导航组件 / Navigation Components

#### top.html (顶部信息栏 / Top Bar)
- **功能 / Purpose**: 页面最顶部的信息栏，左侧文字+右侧社交图标
- **配置 / Config**:
  ```toml
  [params.topbar]
    enable = true
    text = """<p>Contact us at hello@heerise.com</p>"""

  [[menu.topbar]]
    weight = 1
    name = "GitHub"
    url = "https://github.com"
    pre = "<i class='fab fa-2x fa-github'></i>"
  ```

#### nav.html (主导航 / Main Navigation)
- **功能 / Purpose**: 响应式主导航栏，支持 Logo、单级菜单、多级下拉、4 列 mega dropdown
- **特殊功能 / Special features**:
  - 支持带图片的 mega dropdown（`url` 字段设置图片路径）
  - `section.` 前缀的 identifier 创建 dropdown 中的分区标题
  - `post` 字段控制列号 (1-4)
  - `dropdown_mouse_over` 参数控制悬停/点击触发

---

### 落地页组件 / Landing Page Components

#### carousel.html (轮播图 / Homepage Carousel)
- **功能 / Purpose**: 全宽首页轮播图，使用 Owl Carousel 库
- **数据来源 / Data**: `data/carousel/*.yaml` 文件
- **YAML 格式 / Format**:
  ```yaml
  weight: 1          # 排序权重 / Sort order
  title: "标题"       # 标题文字 / Title text
  description: >     # 描述 HTML / Description (supports HTML)
    <ul><li>Item</li></ul>
  image: "img/xxx.png"  # 背景图路径 / Background image
  href: "/link"         # 可选点击链接 / Optional click link
  ```
- **配置 / Config**:
  ```toml
  [params.carouselHomepage]
    enable = true
    auto_play = true
    slide_speed = 2000
    pagination_speed = 1000
  ```

#### features.html (特性展示 / Features Section)
- **功能 / Purpose**: 以图标+标题+描述展示产品特性，支持 2/3/4/6 列布局
- **数据来源 / Data**: `data/features/*.yaml` 文件
- **YAML 格式 / Format**:
  ```yaml
  weight: 1               # 排序权重 / Sort order
  name: "Feature Name"    # 特性名称 (支持 Markdown) / Name (Markdown supported)
  icon: "fas fa-star"     # FontAwesome 图标 CSS 类 / FA icon class
  url: ""                 # 可选链接 / Optional URL
  description: "Text"     # 描述 (支持 Markdown) / Description (Markdown supported)
  ```
- **配置 / Config**:
  ```toml
  [params.features]
    enable = true
    cols = 3    # 每行列数 / Columns per row (2, 3, 4, or 6)
  ```

#### testimonials.html (用户评价 / Testimonials)
- **功能 / Purpose**: Owl Carousel 驱动的用户评价轮播
- **数据来源 / Data**: `data/testimonials/*.yaml` 文件
- **YAML 格式 / Format**:
  ```yaml
  text: "评价内容"          # 评价正文 (支持 Markdown) / Testimonial text
  name: "张三"             # 评价者姓名 / Person name
  position: "CEO, Company" # 职位 / Position
  avatar: "img/xxx.jpg"   # 头像图片路径 / Avatar image
  ```
- **配置 / Config**:
  ```toml
  [params.testimonials]
    enable = true
    title = "Testimonials"
    subtitle = "Description text here."

  [params.carouselTestimonials]
    items = 4
    auto_play = false
    slide_speed = 2000
    pagination_speed = 1000
  ```

#### see_more.html (查看更多 CTA / See More Call-to-Action)
- **功能 / Purpose**: 带图标的 CTA 横幅区域，引导用户前往指定链接
- **纯配置驱动 / Config-only** (无数据文件):
  ```toml
  [params.see_more]
    enable = true
    icon = "far fa-file-alt"      # FontAwesome 图标
    title = "Want to see more?"   # 标题
    subtitle = "Description"      # 副标题
    link_url = "/page"            # 链接 URL
    link_text = "Click here"      # 按钮文字
  ```

#### recent_posts.html (最近博客 / Recent Blog Posts)
- **功能 / Purpose**: 显示最新 4 篇博客文章卡片
- **数据来源 / Data**: 自动从 `content/blog/` 中的 Markdown 文件读取
- **配置 / Config**:
  ```toml
  [params.recent_posts]
    enable = true
    title = "From our blog"
    subtitle = "Latest articles."
    hide_summary = false    # 是否隐藏摘要 / Hide summary text
  ```

#### clients.html (合作伙伴 / Client Logos)
- **功能 / Purpose**: Owl Carousel 驱动的合作伙伴 Logo 轮播
- **数据来源 / Data**: `data/clients/*.yaml` 文件
- **YAML 格式 / Format**:
  ```yaml
  name: "partner-1"           # 名称 / Name
  image: "img/clients/x.png"  # Logo 图片路径 / Logo image
  url: "https://example.com"  # 可选链接 / Optional URL
  ```

---

### 内容页组件 / Content Page Components

#### contact.html (联系页面 / Contact Page)
- **功能 / Purpose**: 联系表单 + 地址信息 + Google Maps
- **触发条件 / Trigger**: 页面 front matter 中 `id = "contact"`
- **表单提交 / Form submission**: 通过 Formspree 外部服务
- **配置 / Config**:
  ```toml
  [params]
    formspree_action = "https://formspree.io/f/xxxxx"
    contact_form_ajax = false
    enableRecaptchaInContactForm = false
    enableGoogleMaps = false
  ```

#### page.html (通用页面内容 / Generic Page Content)
- **功能 / Purpose**: 渲染 Markdown 内容 + Disqus 评论
- **用于 / Used by**: `layouts/page/single.html` 中不带 `id` 参数的页面

#### map.html (Google 地图 / Google Maps)
- **功能 / Purpose**: 嵌入 Google Maps 并添加标记点
- **条件渲染 / Conditional**: 仅在 `enableGoogleMaps = true` 且 `googleMapsApiKey` 非空时显示

#### sidebar.html (侧边栏 / Sidebar)
- **功能 / Purpose**: 博客页面的右侧边栏，包含搜索/分类/标签小部件
- **子组件 / Sub-components**: 调用 `widgets/search.html`, `widgets/categories.html`, `widgets/tags.html`

---

### 侧边栏组件 / Sidebar Widgets

| 组件 / Widget | 文件 / File | 配置 / Config | 功能 / Purpose |
|---|---|---|---|
| 搜索 / Search | `widgets/search.html` | `params.widgets.search` | Google 自定义搜索 |
| 分类 / Categories | `widgets/categories.html` | `params.widgets.categories` | 博客分类列表 |
| 标签 / Tags | `widgets/tags.html` | `params.widgets.tags` | 博客标签列表 |

---

### 页脚组件 / Footer Component

#### footer.html (页脚 / Footer)
- **三栏布局 / Three-column layout**:
  1. **关于我们 / About Us**: 通过 `params.about_us` 配置 (HTML)
  2. **最近文章 / Recent Posts**: 通过 `params.footer.recent_posts.enable` 开关
  3. **联系信息 / Contact Info**: 通过 `params.address` 和 `params.contact_url` 配置

---

## 数据文件格式 / Data File Schemas

### Carousel (轮播图)

文件位置 / Location: `data/carousel/*.yaml`

```yaml
weight: 1                    # int, 必填 / required - 排序
title: "Slide Title"         # string, 必填 / required - 标题
description: >               # string, 必填 / required - HTML 描述
  <p>Some HTML content</p>
image: "img/carousel/x.png"  # string, 必填 / required - 背景图
href: "/link"                # string, 可选 / optional - 点击链接
```

### Features (特性)

文件位置 / Location: `data/features/*.yaml`

```yaml
weight: 1                    # int, 必填 / required - 排序
name: "Feature Name"         # string, 必填 / required - 标题 (Markdown)
icon: "fas fa-icon-name"     # string, 必填 / required - FA 图标类
url: ""                      # string, 可选 / optional - 链接
description: "Text"          # string, 必填 / required - 描述 (Markdown)
```

### Testimonials (评价)

文件位置 / Location: `data/testimonials/*.yaml`

```yaml
text: "Quote text"           # string, 必填 / required - 评价正文
name: "Person Name"          # string, 必填 / required - 姓名
position: "Title, Company"   # string, 必填 / required - 职位
avatar: "img/xxx.jpg"        # string, 必填 / required - 头像图片
```

### Clients (合作伙伴)

文件位置 / Location: `data/clients/*.yaml`

```yaml
name: "client-name"          # string, 必填 / required - 名称
image: "img/clients/x.png"   # string, 必填 / required - Logo 图片
url: "https://example.com"   # string, 可选 / optional - 网站链接
```

---

## CSS 主题变体 / CSS Theme Variants

主题提供 8 种预设颜色方案 / 8 preset color schemes:

| 名称 / Name | 配置值 / Config Value | 主色调 / Primary Color |
|---|---|---|
| 默认 / Default | `"default"` | 浅蓝 / Light Blue |
| 蓝色 / Blue | `"blue"` | 蓝色 / Blue |
| 绿色 / Green | `"green"` | 绿色 / Green |
| 玛萨拉 / Marsala | `"marsala"` | 暗红 / Dark Red |
| 粉色 / Pink | `"pink"` | 粉色 / Pink |
| 红色 / Red | `"red"` | 红色 / Red |
| 绿松石 / Turquoise | `"turquoise"` | 青绿 / Teal |
| 紫色 / Violet | `"violet"` | 紫色 / Purple |

在 `hugo.toml` 中设置 / Set in `hugo.toml`:
```toml
[params]
  style = "default"   # 改为需要的颜色 / Change to desired color
```

**自定义 CSS / Custom CSS**: 创建 `static/css/custom.css` 文件，它会自动加载并覆盖主题默认样式。

---

## 国际化 / i18n Support

主题支持 22 种语言 / Theme supports 22 languages:

bg (保加利亚语), ca (加泰罗尼亚语), cs (捷克语), da (丹麦语), de (德语),
en (英语), es (西班牙语), fr (法语), id (印尼语), it (意大利语),
ja (日语), nl (荷兰语), pl (波兰语), pt-br (巴西葡语), pt-pt (葡萄牙语),
ro (罗马尼亚语), ru (俄语), sv (瑞典语), tr (土耳其语),
zh (简体中文), zh-tw (繁体中文)

切换语言 / Switch language:
```toml
defaultContentLanguage = "zh"   # 切换为中文 / Switch to Chinese
```

翻译文件位于 / Translation files at: `themes/hugo-universal-theme/i18n/`

---

## 自定义组件 / Creating Custom Components

Hugo 的 partial 系统允许你创建自己的可复用组件。

Hugo's partial system lets you create your own reusable components.

### 方法 1: 创建新的 Partial / Method 1: Create a New Partial

1. 在你的站点中创建文件 / Create file in your site:
   `layouts/partials/my_component.html`

2. 编写 HTML + Go Template 代码 / Write HTML + Go Template code:
   ```html
   {{ if .Site.Params.my_component.enable }}
   <section id="my-component">
     <div class="container">
       <div class="row">
         <div class="col-md-12">
           <h2>{{ .Site.Params.my_component.title }}</h2>
           <p>{{ .Site.Params.my_component.content | markdownify }}</p>
         </div>
       </div>
     </div>
   </section>
   {{ end }}
   ```

3. 在 `hugo.toml` 中添加配置 / Add config in `hugo.toml`:
   ```toml
   [params.my_component]
     enable = true
     title = "My Custom Section"
     content = "This is **custom** content."
   ```

4. 在页面模板中调用 / Call in page template:
   ```html
   {{ partial "my_component.html" . }}
   ```

### 方法 2: 数据驱动组件 / Method 2: Data-Driven Component

1. 创建数据文件 / Create data files: `data/my_items/*.yaml`
   ```yaml
   weight: 1
   title: "Item 1"
   description: "Description here"
   icon: "fas fa-star"
   ```

2. 创建 partial / Create partial: `layouts/partials/my_items.html`
   ```html
   {{ if isset .Site.Data "my_items" }}
   {{ if gt (len .Site.Data.my_items) 0 }}
   <section>
     <div class="container">
       {{ range sort .Site.Data.my_items "weight" }}
       <div class="item">
         <i class="{{ .icon }}"></i>
         <h3>{{ .title }}</h3>
         <p>{{ .description | markdownify }}</p>
       </div>
       {{ end }}
     </div>
   </section>
   {{ end }}
   {{ end }}
   ```

### 方法 3: 将组件插入首页 / Method 3: Insert Component into Homepage

要修改首页的组件排列顺序，需要覆盖首页模板:

To modify component order on homepage, override the homepage template:

1. 复制 / Copy: `themes/hugo-universal-theme/layouts/index.html`
   到 / to: `layouts/index.html`

2. 在合适的位置添加你的 partial 调用 / Add your partial call:
   ```html
   {{ partial "carousel.html" . }}
   {{ partial "my_component.html" . }}   <!-- 新增 / New -->
   {{ partial "features.html" . }}
   ```

---

## 覆盖主题文件 / Overriding Theme Files

Hugo 使用"查找顺序"来决定使用哪个模板文件。你的站点目录优先于主题目录。

Hugo uses a "lookup order" - your site directory takes priority over the theme.

| 你想覆盖的文件 / File to Override | 在站点中创建 / Create in Site |
|---|---|
| `themes/.../layouts/index.html` | `layouts/index.html` |
| `themes/.../layouts/partials/nav.html` | `layouts/partials/nav.html` |
| `themes/.../layouts/partials/footer.html` | `layouts/partials/footer.html` |
| `themes/.../static/css/custom.css` | `static/css/custom.css` |
| `themes/.../i18n/en.yaml` | `i18n/en.yaml` |

**重要 / Important**: 不要直接修改 `themes/` 目录下的文件！始终通过在站点目录中创建同名文件来覆盖。

**Important**: Never edit files inside `themes/` directly! Always override by creating same-path files in your site root.

---

## 与 FastAPI 后端集成 / Integrating with FastAPI Backend

当前 Hugo 站点是纯静态的。如果需要与 Heerise 的 FastAPI 后端集成:

The Hugo site is purely static. To integrate with Heerise's FastAPI backend:

### 方案 1: API 调用 / Approach 1: Frontend API Calls

在 `static/js/` 中添加自定义 JS，通过 fetch/AJAX 调用 FastAPI:

Add custom JS in `static/js/` to call FastAPI via fetch/AJAX:

```javascript
// static/js/heerise-api.js
async function fetchFromBackend(endpoint) {
  const response = await fetch(`http://localhost:8000${endpoint}`);
  return response.json();
}
```

在 `layouts/partials/custom_headers.html` 中引入:
```html
<script src="/js/heerise-api.js"></script>
```

### 方案 2: Hugo 作为营销页 + Next.js 作为应用 / Approach 2: Hugo as Landing Page + Next.js as App

- Hugo 站点 (`:1313`) → 营销落地页、博客、FAQ
- Next.js 站点 (`:3000`) → 用户注册、登录、Dashboard 等应用功能
- 通过链接跳转连接两者 (e.g., "Get Started" → `localhost:3000/register`)

### 方案 3: 构建后嵌入 / Approach 3: Build and Embed

```bash
cd frontend/hugo-landing
hugo --minify
# 将 public/ 目录内容部署到任意静态服务器
```

---

## JavaScript 功能说明 / JavaScript Functions Reference

`static/js/front.js` 中包含的功能函数:

| 函数 / Function | 功能 / Purpose |
|---|---|
| `sliderHomepage()` | 初始化首页小型滑块 / Init homepage mini-slider |
| `sliders()` | 初始化所有 Owl Carousel (customers, testimonials, homepage) |
| `menuSliding()` | 下拉菜单滑动动画 / Dropdown slide animation |
| `menuMouseOver()` | 鼠标悬停触发下拉 / Mouseover dropdown trigger |
| `animations()` | Waypoint 滚动触发动画 / Scroll-triggered animations |
| `counters()` | 数字计数器动画 / Number counter animation |
| `fullScreenContainer()` | 全屏容器尺寸计算 / Full screen container sizing |
| `contactFormAjax()` | AJAX 联系表单提交 / Ajax contact form submission |
| `productDetailGallery()` | 产品图片画廊 / Product image gallery |
| `utils()` | 工具函数 (tooltip, 滚动等) / Utilities (tooltip, scroll, etc.) |

---

## 常见操作速查 / Quick Reference

| 操作 / Task | 方法 / How |
|---|---|
| 添加轮播页 / Add carousel slide | 创建 `data/carousel/xxx.yaml` |
| 添加特性 / Add feature | 创建 `data/features/xxx.yaml` |
| 添加评价 / Add testimonial | 创建 `data/testimonials/xxx.yaml` |
| 添加合作伙伴 / Add client | 创建 `data/clients/xxx.yaml` |
| 添加博客 / Add blog post | 创建 `content/blog/xxx.md` |
| 添加页面 / Add page | 创建 `content/xxx.md` |
| 换颜色主题 / Change color | 修改 `hugo.toml` 中 `params.style` |
| 换语言 / Change language | 修改 `hugo.toml` 中 `defaultContentLanguage` |
| 自定义 CSS / Custom CSS | 编辑 `static/css/custom.css` |
| 自定义 JS / Custom JS | 创建 `static/js/xxx.js` + 在 `custom_headers.html` 引入 |
| 关闭某区域 / Disable section | 在 `hugo.toml` 中设置对应 `enable = false` |
```

---

## 第十步: 验证所有文件完整性 / Step 10: Final Verification

执行完以上所有步骤后，确认以下目录结构存在:

```
E:\Heerise\frontend\hugo-landing\
├── hugo.toml                     ✓
├── HUGO_THEME_README.md          ✓
├── content\
│   ├── contact.md                ✓
│   ├── faq.md                    ✓
│   └── blog\
│       ├── first-post.md         ✓
│       └── career-tips.md        ✓
├── data\
│   ├── carousel\
│   │   ├── welcome.yaml          ✓
│   │   └── features.yaml         ✓
│   ├── features\
│   │   ├── coaching.yaml         ✓
│   │   ├── analytics.yaml        ✓
│   │   └── learning.yaml         ✓
│   ├── testimonials\
│   │   ├── 1.yaml                ✓
│   │   └── 2.yaml                ✓
│   └── clients\
│       ├── 1.yaml                ✓
│       └── 2.yaml                ✓
├── static\
│   ├── css\                      ✓ (从 exampleSite 复制)
│   └── img\                      ✓ (从 exampleSite 复制)
└── themes\
    └── hugo-universal-theme\     ✓ (git clone)
```

最后再次运行 `hugo server -w` 确认一切正常。

---

## 重要提示 / Important Notes

1. **不要修改** `frontend/pages/`、`frontend/styles/` 等现有 Next.js 文件
2. **不要修改** `themes/hugo-universal-theme/` 内的任何文件，使用覆盖机制
3. Hugo 开发服务器运行在 `:1313`，Next.js 运行在 `:3000`，互不冲突
4. 所有自定义通过站点根目录文件覆盖，保持主题可升级
