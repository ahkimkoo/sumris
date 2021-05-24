const {ipcRenderer} = require('electron')
const { clipboard } = require('electron');

new Vue({
    el: '#app',
    data: function() {
      return { 
        form: {
            'url': '',
            'title': '',
            'content': '',
            'summary': '',
            'keywords': [],
            'wordcount':100,
            'keywordcount':10,
            'shingle':false,
          },
        loading:false
       }
    },
    mounted: function () {
        let self = this;
        this.$nextTick(() => {
          ipcRenderer.on('got-article', (event, result) => {
            if (result){
              self.form.title = result['title'];
              self.form.content = result['content'];
            }
            self.loading = false;
          });
          ipcRenderer.on('got-summary', (event, result) => {
            if (result){
              self.form.summary = result;
            }
            self.loading = false;
          });
          ipcRenderer.on('got-keywords', (event, result) => {
            if (result){
                self.form.keywords = result.map((x,idx)=>{return {'label':x['word'],'type':['','success','info','danger','warning'][idx%5]}});
            }
            self.loading = false;
          });
        });
    },
    methods: {
        getArticle: function () {
          let self = this;
          ipcRenderer.send(
            'get-article',
            self.form.url
          );
          self.loading = true;
        },
        getSummary: function () {
            let self = this;
            if(self.form.content.trim()==''){
                this.$message.error('内容都没有嘛，怎么提摘要？');
            }else{
                ipcRenderer.send(
                    'get-summary',
                    {
                        'title':self.form.title,
                        'content':self.form.content,
                        'wordcount':self.form.wordcount,
                        'keywordcount':self.form.keywordcount,
                        'shingle':self.form.shingle
                    }
                  );
                  self.loading = true;
            }
        },
        getKeywords: function () {
            let self = this;
            if(self.form.content.trim()==''){
                this.$message.error('内容都没有嘛，怎么提关键词？');
            }else{
                ipcRenderer.send(
                'get-keywords',
                self.form.content,
                self.form.keywordcount
                );
                self.loading = true;
            }
        },
        clearContent:function(){
            let self = this;
            self.form.title = '';
            self.form.content = '';
            this.$message({
                message: '标题正文已清空',
                type: 'success'
            });
        },
        copySummaryToClipBoard:function(text,event){
            let self = this;
            clipboard.writeText(self.form.summary);
            this.$message({
                message: '摘要已复制到剪贴板',
                type: 'success'
            });
        },
        copyKeywordsToClipBoard:function(text,event){
            let self = this;
            let keywordsStr = self.form.keywords.map(x=>{return x['label']}).join('  ')
            clipboard.writeText(keywordsStr);
            this.$message({
                message: '关键词已复制到剪贴板',
                type: 'success'
            });
        }
    }
})