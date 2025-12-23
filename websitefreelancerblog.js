class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      title: '',
      featuredImage: '',
      markdownContent: '',
      authorName: '',
      authorAvatar: '',
      authorBio: '',
      isLoading: true
    };

    this.initializeUI();
  }

  // CMS Integration - Observed attributes
  static get observedAttributes() {
    return [
      'cms-markdown-content',
      'cms-author-name',
      'cms-author-avatar',
      'cms-author-bio'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      // updateContent is now async, so we don't await it here
      this.updateContent().catch(error => {
        console.error('Error updating content:', error);
      });
    } else if (name === 'cms-author-name') {
      this.state.authorName = newValue;
      this.updateAuthorSection();
    } else if (name === 'cms-author-avatar') {
      this.state.authorAvatar = newValue;
      this.updateAuthorSection();
    } else if (name === 'cms-author-bio') {
      this.state.authorBio = newValue;
      this.updateAuthorSection();
    }
  }

  // Initialize the UI components with beautiful, modern dark design
  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
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
          color: #E0E0E0;
        }

        /* Loading State */
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
          border: 4px solid #333;
          border-top: 4px solid #64FFDA;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: #999;
          font-size: 16px;
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Author Section */
        .author-section {
          background: linear-gradient(135deg, #252525 0%, #2a2a2a 100%);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .author-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .author-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #64FFDA;
          box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
        }

        .author-avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #64FFDA 0%, #4DD0BA 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: #1E1E1E;
          border: 3px solid #64FFDA;
          box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
        }

        .author-info {
          flex: 1;
        }

        .author-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #999;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .author-name {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .author-bio {
          color: #bbb;
          line-height: 1.6;
          font-size: 15px;
          margin: 0;
        }

        /* Table of Contents */
        .table-of-contents {
          background: linear-gradient(135deg, #252525 0%, #2a2a2a 100%);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out 0.2s both;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .toc-title {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
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
          color: #bbb;
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
          background-color: rgba(100, 255, 218, 0.1);
        }

        .toc-list .toc-level-2 {
          padding-left: 12px;
        }

        .toc-list .toc-level-3 {
          padding-left: 32px;
          font-size: 15px;
        }

        .toc-list .toc-level-4 {
          padding-left: 48px;
          font-size: 14px;
        }

        .toc-list .toc-level-5,
        .toc-list .toc-level-6 {
          padding-left: 64px;
          font-size: 13px;
        }

        /* Blog Content */
        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #E0E0E0;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        /* Markdown Styling - Dark Theme */
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

        .blog-content h1 {
          font-size: clamp(32px, 4vw, 42px);
          margin-top: 60px;
        }

        .blog-content h2 {
          font-size: clamp(28px, 3.5vw, 36px);
          margin-top: 50px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }

        .blog-content h3 {
          font-size: clamp(24px, 3vw, 30px);
        }

        .blog-content h4 {
          font-size: clamp(20px, 2.5vw, 24px);
        }

        .blog-content h5 {
          font-size: clamp(18px, 2vw, 20px);
        }

        .blog-content h6 {
          font-size: clamp(16px, 1.8vw, 18px);
        }

        .blog-content p {
          margin-bottom: 24px;
          font-size: 18px;
          line-height: 1.8;
          color: #FFFFFF;
        }

        .blog-content a {
          color: #FFFF05;
          text-decoration: none;
          border-bottom: 1px solid #FFFF05;
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: #FFFF88;
          border-bottom-color: #FFFF88;
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #ffffff;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
          color: #ccc;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content li {
          margin-bottom: 12px;
          line-height: 1.8;
          color: #FFFFFF;
        }

        .blog-content ul li {
          list-style-type: disc;
        }

        .blog-content ol li {
          list-style-type: decimal;
        }

        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #FFFF05;
          background-color: #252525;
          font-style: italic;
          color: #bbb;
          border-radius: 0 8px 8px 0;
        }

        .blog-content blockquote p {
          margin-bottom: 0;
        }

        .blog-content code {
          background-color: #2a2a2a;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #e74c3c;
          border: 1px solid #333;
        }

        .blog-content pre {
          background-color: #0d1117;
          color: #c9d1d9;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 30px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          border: 1px solid #30363d;
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #c9d1d9;
          font-size: 14px;
          border: none;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 30px 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid #333;
          margin: 40px 0;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #333;
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #333;
          color: #FFFFFF;
        }

        .blog-content table th {
          background-color: #252525;
          font-weight: 700;
          color: #ffffff;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tr:hover {
          background-color: #252525;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blog-post-container {
            padding: 30px 16px;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3 {
            margin-top: 30px;
          }

          .author-section {
            padding: 24px;
            margin-bottom: 30px;
          }

          .author-header {
            gap: 16px;
          }

          .author-avatar,
          .author-avatar-placeholder {
            width: 60px;
            height: 60px;
          }

          .author-avatar-placeholder {
            font-size: 28px;
          }

          .author-name {
            font-size: 20px;
          }

          .author-bio {
            font-size: 14px;
          }

          .table-of-contents {
            padding: 20px;
            margin-bottom: 30px;
          }

          .toc-title {
            font-size: 18px;
          }

          .toc-list a {
            font-size: 15px;
          }

          .blog-content blockquote {
            padding: 16px 20px;
            margin: 20px 0;
          }

          .blog-content pre {
            padding: 16px;
            font-size: 13px;
          }

          .blog-content ul,
          .blog-content ol {
            padding-left: 20px;
          }
        }

        @media (max-width: 480px) {
          .blog-post-container {
            padding: 20px 12px;
          }

          .blog-content {
            font-size: 15px;
          }

          .author-section {
            padding: 20px;
          }

          .author-header {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }

          .table-of-contents {
            padding: 16px;
          }

          .toc-title {
            font-size: 16px;
          }

          .toc-list a {
            font-size: 14px;
          }

          .blog-content table {
            font-size: 14px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 8px 12px;
          }
        }

        /* Print Styles */
        @media print {
          .blog-post-container {
            max-width: 100%;
            padding: 0;
            background-color: #fff;
            color: #000;
          }

          .author-section,
          .table-of-contents {
            background: #f5f5f5;
            border-color: #ddd;
          }

          .blog-content a {
            color: #000;
            border-bottom: none;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3,
          .blog-content h4,
          .blog-content h5,
          .blog-content h6 {
            color: #000;
          }
        }
      </style>

      <div class="blog-post-container">
        <div class="loading-state" id="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>

        <div id="blog-content-wrapper" style="display: none;">
          <div id="author-section"></div>
          <div id="table-of-contents"></div>
          <div class="blog-content" id="blog-content"></div>
        </div>
      </div>
    `;

    // Get DOM references
    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.authorSection = this.shadowRoot.getElementById('author-section');
    this.tocElement = this.shadowRoot.getElementById('table-of-contents');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
  }

  // Update Author Section
  updateAuthorSection() {
    if (!this.authorSection) return;

    const { authorName, authorAvatar, authorBio } = this.state;

    // Don't show author section if no author data
    if (!authorName && !authorBio) {
      this.authorSection.innerHTML = '';
      return;
    }

    // Get initials for placeholder avatar
    const getInitials = (name) => {
      if (!name) return '?';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const initials = getInitials(authorName);

    this.authorSection.innerHTML = `
      <div class="author-section">
        <div class="author-header">
          ${authorAvatar 
            ? `<img src="${authorAvatar}" alt="${authorName}" class="author-avatar">` 
            : `<div class="author-avatar-placeholder">${initials}</div>`
          }
          <div class="author-info">
            <div class="author-label">Written by</div>
            <h3 class="author-name">${authorName || 'Anonymous'}</h3>
          </div>
        </div>
        ${authorBio ? `<p class="author-bio">${authorBio}</p>` : ''}
      </div>
    `;
  }

  // Generate Table of Contents from headings
  generateTableOfContents(htmlContent) {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all headings (h1-h6)
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return ''; // No headings, no TOC
    }
    
    // Generate unique IDs for each heading and build TOC
    const tocItems = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1)); // Get number from h1, h2, etc.
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      // Add ID to the heading
      heading.id = id;
      
      // Add to TOC items
      tocItems.push({
        level: level,
        text: text,
        id: id
      });
    });
    
    // Update the content with IDs added to headings
    const updatedContent = tempDiv.innerHTML;
    
    // Build TOC HTML
    let tocHtml = `
      <div class="table-of-contents">
        <div class="toc-title">
          <span class="toc-icon">📑</span>
          Table of Contents
        </div>
        <ul class="toc-list">
    `;
    
    tocItems.forEach(item => {
      tocHtml += `
        <li class="toc-level-${item.level}">
          <a href="#${item.id}">${item.text}</a>
        </li>
      `;
    });
    
    tocHtml += `
        </ul>
      </div>
    `;
    
    return {
      toc: tocHtml,
      content: updatedContent
    };
  }

  // Update content with Markdown rendering and automatic TOC
  async updateContent() {
    if (this.contentElement && this.tocElement) {
      try {
        console.log('📝 Updating markdown content...');
        
        // Ensure marked.js is loaded first
        await this.loadMarkedJS();
        
        // Now use marked to parse content
        console.log('🔄 Parsing markdown with marked.js...');
        const htmlContent = window.marked.parse(this.state.markdownContent);
        const result = this.generateTableOfContents(htmlContent);
        
        if (result && result.toc) {
          this.tocElement.innerHTML = result.toc;
          this.contentElement.innerHTML = result.content;
          
          // Add smooth scroll behavior to TOC links
          this.addSmoothScrollToTOC();
          console.log('✓ Content updated with TOC');
        } else {
          // No headings found, just show content without TOC
          this.tocElement.innerHTML = '';
          this.contentElement.innerHTML = htmlContent;
          console.log('✓ Content updated (no TOC)');
        }
      } catch (error) {
        console.error('❌ Error updating content:', error);
        this.contentElement.innerHTML = `
          <div style="padding: 20px; background: #2a2a2a; border-left: 4px solid #e74c3c; color: #e74c3c;">
            <strong>Error rendering content</strong><br>
            ${error.message}
          </div>
        `;
      }
    }
    
    this.hideLoading();
  }

  // Add smooth scroll behavior to TOC links
  addSmoothScrollToTOC() {
    const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = this.contentElement.querySelector(`#${targetId}`);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a highlight effect to the target heading
          targetElement.style.transition = 'background-color 0.3s ease';
          targetElement.style.backgroundColor = 'rgba(100, 255, 218, 0.15)';
          targetElement.style.padding = '8px';
          targetElement.style.marginLeft = '-8px';
          targetElement.style.marginRight = '-8px';
          targetElement.style.borderRadius = '4px';
          
          setTimeout(() => {
            targetElement.style.backgroundColor = 'transparent';
          }, 1500);
        }
      });
    });
  }

  // Load marked.js library dynamically
  loadMarkedJS() {
    return new Promise((resolve, reject) => {
      // Check if marked is already loaded
      if (typeof window.marked !== 'undefined') {
        resolve();
        return;
      }
      
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="marked"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load marked.js')));
        return;
      }
      
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
      script.onload = () => {
        console.log('✓ marked.js loaded successfully');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load marked.js'));
      document.head.appendChild(script);
    });
  }

  // Hide loading state and show content
  hideLoading() {
    if (this.loadingState && this.contentWrapper) {
      this.loadingState.style.display = 'none';
      this.contentWrapper.style.display = 'block';
    }
  }

  // Connected callback
  async connectedCallback() {
    // Load marked.js when component is connected
    try {
      await this.loadMarkedJS();
      console.log('✓ Markdown parser ready');
      
      // If we already have markdown content, update the UI
      if (this.state.markdownContent) {
        this.updateContent();
      }
    } catch (error) {
      console.error('❌ Error loading marked.js:', error);
      // Show error message to user
      if (this.contentElement) {
        this.contentElement.innerHTML = '<p style="color: #e74c3c;">Error loading Markdown parser. Please refresh the page.</p>';
      }
      this.hideLoading();
    }
  }
}

// Register the custom element for Wix
customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

// Wix Custom Element Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

// Global registration for Wix environment
if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
