class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      featuredImage: '',
      markdownContent: '',
      title: '',
      isLoading: true
    };

    this.markedLoaded = false;
    this.markedLoading = false;
    this.contentQueue = null;
    this.initializeUI();
  }

  static get observedAttributes() {
    return ['cms-markdown-content', 'cms-featured-image', 'cms-title'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('Attribute changed:', name, 'Value:', newValue ? newValue.substring(0, 100) : 'empty');
    
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      this.queueContentUpdate();
    } else if (name === 'cms-featured-image') {
      this.state.featuredImage = newValue;
      this.updateFeaturedImage();
    } else if (name === 'cms-title') {
      this.state.title = newValue;
    }
  }

  queueContentUpdate() {
    console.log('🔄 Queueing content update...');
    
    if (this.contentQueue) {
      clearTimeout(this.contentQueue);
    }
    
    this.contentQueue = setTimeout(() => {
      this.updateContent();
    }, 100);
  }

  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        .blog-post-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1E1E1E;
          min-height: 400px;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          flex-direction: column;
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #64FFDA;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: #ffffff;
          font-size: 16px;
        }

        .error-state {
          display: none;
          padding: 20px;
          background-color: #ff4444;
          color: white;
          border-radius: 8px;
          margin: 20px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .featured-image-container {
          width: 100%;
          margin-bottom: 40px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .featured-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .table-of-contents {
          background-color: #2d2d2d;
          border: 2px solid #3d3d3d;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        .toc-title {
          font-size: 20px;
          font-weight: 700;
          color: #64FFDA;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toc-icon {
          font-size: 22px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-list li {
          margin-bottom: 8px;
        }

        .toc-list a {
          color: #ffffff;
          text-decoration: none;
          display: block;
          padding: 6px 0;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          padding-left: 12px;
        }

        .toc-list a:hover {
          color: #64FFDA;
          border-left-color: #64FFDA;
          padding-left: 16px;
          background-color: rgba(100, 255, 218, 0.05);
        }

        .toc-list .toc-level-2 { padding-left: 12px; }
        .toc-list .toc-level-3 { padding-left: 32px; font-size: 15px; }
        .toc-list .toc-level-4 { padding-left: 48px; font-size: 14px; }
        .toc-list .toc-level-5,
        .toc-list .toc-level-6 { padding-left: 64px; font-size: 13px; }

        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #ffffff;
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #64FFDA;
          letter-spacing: -0.01em;
        }

        .blog-content h1 { font-size: clamp(32px, 4vw, 42px); margin-top: 60px; }
        .blog-content h2 { font-size: clamp(28px, 3.5vw, 36px); margin-top: 50px; }
        .blog-content h3 { font-size: clamp(24px, 3vw, 30px); }
        .blog-content h4 { font-size: clamp(20px, 2.5vw, 24px); }
        .blog-content h5 { font-size: clamp(18px, 2vw, 20px); }
        .blog-content h6 { font-size: clamp(16px, 1.8vw, 18px); }

        .blog-content p {
          margin-bottom: 24px;
          font-size: 18px;
          line-height: 1.8;
        }

        .blog-content a {
          color: #FFFF05;
          text-decoration: none;
          border-bottom: 1px solid #FFFF05;
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: #FFFF05;
          border-bottom-color: #FFFF05;
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #64FFDA;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content li {
          margin-bottom: 12px;
          line-height: 1.8;
        }

        .blog-content ul li { list-style-type: disc; }
        .blog-content ol li { list-style-type: decimal; }

        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #FFFF05;
          background-color: #2d2d2d;
          font-style: italic;
          color: #FFFF05;
          border-radius: 0 8px 8px 0;
        }

        .blog-content blockquote p {
          margin-bottom: 0;
        }

        .blog-content code {
          background-color: #2d2d2d;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #64FFDA;
        }

        .blog-content pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #f8f8f2;
          font-size: 14px;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 30px auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: block;
          background-color: #2d2d2d;
          padding: 4px;
        }

        .blog-content img + em {
          display: block;
          text-align: center;
          font-size: 14px;
          color: #999;
          margin-top: -20px;
          margin-bottom: 20px;
          font-style: italic;
        }

        .blog-content img.image-error {
          border: 2px dashed #ff4444;
          min-height: 150px;
          background-color: #2d2d2d;
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid #3d3d3d;
          margin: 40px 0;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          overflow: hidden;
          background-color: #2d2d2d;
          display: table !important;
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #3d3d3d;
          color: #ffffff;
        }

        .blog-content table thead { display: table-header-group !important; }
        .blog-content table tbody { display: table-row-group !important; }
        .blog-content table tr { display: table-row !important; }
        .blog-content table th { display: table-cell !important; }
        .blog-content table td { display: table-cell !important; }

        .blog-content table th {
          background-color: #1a1a1a;
          font-weight: 700;
          color: #64FFDA;
          border-bottom: 2px solid #64FFDA;
        }

        .blog-content table tbody tr {
          background-color: #2d2d2d;
        }

        .blog-content table tbody tr:nth-child(even) {
          background-color: #252525;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tbody tr:hover {
          background-color: #333333;
        }

        @media (max-width: 768px) {
          .blog-post-container { padding: 30px 16px; }
          .featured-image-container { margin-bottom: 30px; }
          .blog-content { font-size: 16px; }
          .blog-content h1, .blog-content h2, .blog-content h3 { margin-top: 30px; }
          .table-of-contents { padding: 20px; margin-bottom: 30px; }
          .toc-title { font-size: 18px; }
          .toc-list a { font-size: 15px; }
          .blog-content table {
            font-size: 14px;
            display: block !important;
            overflow-x: auto;
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .blog-post-container { padding: 20px 12px; }
          .featured-image-container { margin-bottom: 24px; }
          .blog-content { font-size: 15px; }
          .table-of-contents { padding: 16px; }
          .toc-title { font-size: 16px; }
          .toc-list a { font-size: 14px; }
          .blog-content table th,
          .blog-content table td {
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      </style>

      <div class="blog-post-container">
        <div class="loading-state" id="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>

        <div class="error-state" id="error-state">
          <p>Error loading content. Please refresh the page.</p>
        </div>

        <div id="blog-content-wrapper" style="display: none;">
          <div class="featured-image-container" id="featured-image-container" style="display: none;">
            <img class="featured-image" id="featured-image" alt="Blog featured image" />
          </div>
          <div id="table-of-contents"></div>
          <div class="blog-content" id="blog-content"></div>
        </div>
      </div>
    `;

    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.errorState = this.shadowRoot.getElementById('error-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.featuredImageContainer = this.shadowRoot.getElementById('featured-image-container');
    this.featuredImageElement = this.shadowRoot.getElementById('featured-image');
    this.tocElement = this.shadowRoot.getElementById('table-of-contents');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
  }

  // SIMPLIFIED: Just use HTML img tags directly - no placeholder needed
  preprocessMarkdownImages(markdown) {
    console.log('🔧 Converting markdown images to HTML...');
    
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imageCount = 0;
    
    const processed = markdown.replace(imagePattern, (match, alt, url) => {
      imageCount++;
      console.log(`  Image ${imageCount}: ${url.substring(0, 60)}...`);
      
      // Convert directly to HTML img tag - bypasses all markdown processing
      return `<img src="${url}" alt="${alt}" loading="lazy" />`;
    });
    
    console.log(`✓ Converted ${imageCount} image(s) to HTML tags`);
    return processed;
  }

  fixImages() {
    const images = this.contentElement.querySelectorAll('img');
    console.log(`\n🖼️ IMAGE DEBUG: Found ${images.length} images`);
    
    images.forEach((img, index) => {
      const originalSrc = img.getAttribute('src');
      const altText = img.getAttribute('alt') || 'No alt text';
      
      console.log(`Image ${index + 1}:`, originalSrc);
      
      img.addEventListener('error', function() {
        console.error(`❌ Failed to load image ${index + 1}:`, this.src);
        this.classList.add('image-error');
        this.style.minHeight = '150px';
      });
      
      img.addEventListener('load', function() {
        console.log(`✅ Successfully loaded image ${index + 1}`);
      });
      
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      if (originalSrc && (originalSrc.includes('wixstatic.com') || originalSrc.includes('unsplash.com'))) {
        img.setAttribute('crossorigin', 'anonymous');
      }
    });
  }

  generateTableOfContents(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return { toc: '', content: htmlContent };
    }
    
    const tocItems = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      heading.id = id;
      tocItems.push({ level, text, id });
    });
    
    const updatedContent = tempDiv.innerHTML;
    
    let tocHtml = `
      <div class="table-of-contents">
        <div class="toc-title">
          <span class="toc-icon">📑</span>
          Table of Contents
        </div>
        <ul class="toc-list">
    `;
    
    tocItems.forEach(item => {
      tocHtml += `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
    });
    
    tocHtml += `</ul></div>`;
    
    return { toc: tocHtml, content: updatedContent };
  }

  simpleMarkdownParse(markdown) {
    let html = markdown;
    
    // Tables first
    html = this.parseMarkdownTables(html);
    
    // Images are already HTML - skip
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Headers
    html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/gim, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  }

  parseMarkdownTables(markdown) {
    const lines = markdown.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        const isSeparator = /^[\s\|:-]+$/.test(nextLine);
        
        if (!inTable && isSeparator) {
          inTable = true;
          const headerCells = cells.map(cell => `<th>${cell}</th>`).join('');
          tableRows.push(`<thead><tr>${headerCells}</tr></thead><tbody>`);
          i++;
        } else if (inTable && cells.length > 0) {
          const dataCells = cells.map(cell => `<td>${cell}</td>`).join('');
          tableRows.push(`<tr>${dataCells}</tr>`);
        } else if (!inTable) {
          result.push(line);
        }
      } else {
        if (inTable) {
          tableRows.push('</tbody>');
          result.push(`<table>${tableRows.join('')}</table>`);
          tableRows = [];
          inTable = false;
        }
        result.push(line);
      }
    }
    
    if (inTable) {
      tableRows.push('</tbody>');
      result.push(`<table>${tableRows.join('')}</table>`);
    }
    
    return result.join('\n');
  }

  updateFeaturedImage() {
    if (this.featuredImageElement && this.featuredImageContainer && this.state.featuredImage) {
      this.featuredImageElement.src = this.state.featuredImage;
      this.featuredImageContainer.style.display = 'block';
      
      this.featuredImageElement.addEventListener('error', () => {
        console.error('❌ Failed to load featured image');
        this.featuredImageContainer.style.display = 'none';
      });
      
      this.featuredImageElement.addEventListener('load', () => {
        console.log('✅ Featured image loaded');
      });
    }
  }

  updateContent() {
    console.log('🎯 updateContent called');
    
    if (!this.contentElement || !this.state.markdownContent) {
      return;
    }

    this.loadMarkedJS()
      .then(() => {
        console.log('✅ Parsing content...');
        let htmlContent;
        
        try {
          // CRITICAL: Convert images to HTML BEFORE any parsing
          const preprocessed = this.preprocessMarkdownImages(this.state.markdownContent);
          
          if (window.marked && typeof window.marked === 'function') {
            // Try using marked as a function
            htmlContent = window.marked(preprocessed);
            console.log('✅ Parsed with marked.js');
          } else if (window.marked && window.marked.parse) {
            marked.use({
              breaks: true,
              gfm: true,
              headerIds: true,
              mangle: false
            });
            htmlContent = marked.parse(preprocessed);
            console.log('✅ Parsed with marked.parse()');
          } else {
            console.warn('⚠️ Using fallback parser');
            htmlContent = this.simpleMarkdownParse(preprocessed);
          }
        } catch (error) {
          console.error('❌ Parse error:', error);
          htmlContent = this.simpleMarkdownParse(this.preprocessMarkdownImages(this.state.markdownContent));
        }
        
        const result = this.generateTableOfContents(htmlContent);
        
        if (result.toc) {
          this.tocElement.innerHTML = result.toc;
          this.contentElement.innerHTML = result.content;
          this.addSmoothScrollToTOC();
        } else {
          this.tocElement.innerHTML = '';
          this.contentElement.innerHTML = result.content;
        }
        
        setTimeout(() => {
          this.fixImages();
          this.debugTables();
        }, 100);
        
        console.log('✅ Content updated');
        this.hideLoading();
      })
      .catch(error => {
        console.error('❌ Error:', error);
        this.hideLoading();
      });
  }

  debugTables() {
    const tables = this.contentElement.querySelectorAll('table');
    console.log(`📊 Found ${tables.length} table(s)`);
  }

  addSmoothScrollToTOC() {
    const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = this.contentElement.querySelector(`#${targetId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  loadMarkedJS() {
    return new Promise((resolve, reject) => {
      if (window.marked) {
        console.log('✅ marked.js already loaded');
        this.markedLoaded = true;
        resolve();
        return;
      }
      
      if (this.markedLoading) {
        const checkInterval = setInterval(() => {
          if (window.marked) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }
      
      console.log('📥 Loading marked.js...');
      this.markedLoading = true;
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ marked.js loaded');
        this.markedLoaded = true;
        this.markedLoading = false;
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load marked.js');
        this.markedLoading = false;
        reject(new Error('Failed to load marked.js'));
      };
      document.head.appendChild(script);
    });
  }

  showError(message) {
    if (this.errorState) {
      this.errorState.textContent = message;
      this.errorState.style.display = 'block';
    }
    if (this.loadingState) {
      this.loadingState.style.display = 'none';
    }
  }

  hideLoading() {
    if (this.loadingState && this.contentWrapper) {
      this.loadingState.style.display = 'none';
      this.contentWrapper.style.display = 'block';
    }
  }

  connectedCallback() {
    console.log('🎬 Custom element connected');
    
    this.loadMarkedJS().catch(error => console.error('Error loading marked.js:', error));
    
    const cmsContent = this.getAttribute('cms-markdown-content');
    const cmsFeaturedImage = this.getAttribute('cms-featured-image');
    const cmsTitle = this.getAttribute('cms-title');
    
    if (cmsContent) {
      this.state.markdownContent = cmsContent;
      this.queueContentUpdate();
    }
    
    if (cmsFeaturedImage) {
      this.state.featuredImage = cmsFeaturedImage;
      this.updateFeaturedImage();
    }

    if (cmsTitle) {
      this.state.title = cmsTitle;
    }
  }
}

customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
