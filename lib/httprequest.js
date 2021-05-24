/**
 * Created by cherokee on 14-6-16.
 */
var urlUtil =  require("url");
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
try { var unzip = require('zlib').unzip } catch(e) { console.error('unzip not supported') }
try { var inflate = require('zlib').inflate } catch(e) { console.error('inflate not supported') }
var http = require('http');
var https = require('https');

/**
 * request page
 * callback(err,status_code,content,page_encoding,param)
*/
var request = function(url,referer,cookie,proxy,timeout,isbin,callback,param){
    var timeOuter = false;
    var callbackCount = 0;
    if(proxy){
        var proxyRouter = proxy.split(':');
        var __host = proxyRouter[0];
        var __port = proxyRouter[1];
        var __path =  url;
    }else{
        var urlobj = urlUtil.parse(url);
        var __host = urlobj['hostname'];
        var __port = urlobj['port'];
        var __path = urlobj['path'];
    }
    var startTime = new Date();
    var options = {
        'host': __host,
        'port': __port,
        'path': __path,
        'method': 'GET',
        'headers': {
            "User-Agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36",
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            //"Accept-Encoding":"gzip,deflate,sdch",
            "Accept-Encoding":"gzip",
            "Accept-Language":"zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4"
        }
    };

    if(cookie){
        var cookie_kvarray = [];
        for(var i=0; i<cookie.length; i++){
            cookie_kvarray.push(cookie[i]['name']+'='+cookie[i]['value']);
        }
        var cookies_str = cookie_kvarray.join(';');
        if(cookies_str.length>0)options['headers']['Cookie'] = cookies_str;
    }

    if(referer)options['headers']['Referer'] = referer;

    var req = http.request(options, function(res) {
        if(res.statusCode==301||res.statusCode==302){
            if(res.headers['location']){
                return request(res.headers['location'],referer,cookie,proxy,timeout,isbin,callback,param);
            }
        }

        var bufferHelper = new BufferHelper();

       // res.setEncoding('utf8');

        res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });

        res.on('end', function () {
            //console.log('Response end, '+url+' use proxy: '+proxy);
            if(timeOuter){
                clearTimeout(timeOuter);
                timeOuter = false;
            }
            if(!req)return callback(new Error('time out'),504,null,null,param||callbackCount++);
            req = null;

            var res_encoding = res.headers['content-encoding'];
            if (res_encoding == 'gzip' && typeof unzip != 'undefined') {
                unzip(bufferHelper.toBuffer(), function(err, buff) {
                    if (!err && buff) {
                        var page_encoding = get_page_encoding(res.headers,buff);
                        page_encoding = page_encoding.toLowerCase().replace('\-','');
                        if(isbin){
                            if(callbackCount<1)callback(null,res.statusCode,buff,page_encoding,param||callbackCount++);
                        }
                        else {
                            if(callbackCount<1)callback(null,res.statusCode,iconv.decode(buff,page_encoding),page_encoding,param||callbackCount++);
                        }
                    }else {if(callbackCount<1)callback(new Error('gzip no content '+err),res.statusCode,null,page_encoding,param||callbackCount++);}
                });
            } else if (res_encoding == 'deflate' && typeof inflate != 'undefined') {
                inflate(bufferHelper.toBuffer(), function(err, buff) {
                    if (!err && buff) {
                        var page_encoding = get_page_encoding(res.headers,buff);
                        page_encoding = page_encoding.toLowerCase().replace('\-','');
                        if(isbin){if(callbackCount<1)callback(null,res.statusCode,buff,page_encoding,param||callbackCount++);}
                        else {if(callbackCount<1)callback(null,res.statusCode,iconv.decode(buff,page_encoding),page_encoding,param||callbackCount++);}
                    }else {if(callbackCount<1)callback(new Error('deflate no content '+err),res.statusCode,null,page_encoding,param||callbackCount++);}
                });
            } else {
                var page_encoding = get_page_encoding(res.headers,bufferHelper.toBuffer());
                page_encoding = page_encoding.toLowerCase().replace('\-','');
                if(isbin){if(callbackCount<1)callback(null,res.statusCode,bufferHelper.toBuffer(),page_encoding,param||callbackCount++);}
                else {if(callbackCount<1)callback(null,res.statusCode,iconv.decode(bufferHelper.toBuffer(),page_encoding),page_encoding,param||callbackCount++);}
            }
        });
    });

    timeOuter = setTimeout(function(){
        if(req){
            //console.error('download timeout, '+url+', cost: '+((new Date())-startTime)+'ms ');
            req.abort();//req.destroy();
            req = null;
            if(callbackCount<1)callback(new Error('time out'),504,null,null,param||callbackCount++);
        }
    },(timeout||30)*1000);

    req.on('error', function(e) {
        //console.error('problem with request: ' + e.message+', url:'+url);
        if(timeOuter){
            clearTimeout(timeOuter);
            timeOuter = false;
        }
        if(req){
            req.abort();//req.destroy();
            req = null;
            if(callbackCount<1)callback(new Error('request error'),500,null,null,param||callbackCount++);
        }
    });
    req.end();
}

var get_page_encoding = function(header, buff){
    var page_encoding = 'utf-8';
    //get the encoding from header
    if(header['content-type']!=undefined){
        var contentType = header['content-type'];
        var patt = new RegExp("^.*?charset\=(.+)$","ig");
        var mts = patt.exec(contentType);
        if (mts != null)
        {
            page_encoding = mts[1];
        }else if(buff){
            var decoded_body = iconv.decode(buff,'utf-8');
            var m = /<meta.*?charset\s?=\"?([\w\d-]+)[^>]+>/ig.exec(decoded_body);
            if(m && m.length>0){
                var ecode_from_page = m[1];
                page_encoding = ecode_from_page;
            }
        }
    }
    return page_encoding;
}

const postJsonHttpsRequet = function(url, header, data, callback) {
    let urlObj = urlUtil.parse(url);
    let datastr = JSON.stringify(data);
    if(!header.hasOwnProperty('Content-Length'))header['Content-Length'] = datastr.length;
    let options = {
        hostname: urlObj['hostname'],
        port: 443,
        path: urlObj['path'],
        method: 'POST',
        headers: header
    };
    let req = https.request(options, (res) => {
        // res.setEncoding('utf8');
        let bufferHelper = new BufferHelper();
        res.on('data', _ => bufferHelper.concat(_));
        res.on('end', () => {
            try {
                if (res.statusCode == 200) {
                    req.abort();
                    var res_encoding = res.headers['content-encoding'];
                    if (res_encoding == 'gzip' && typeof unzip != 'undefined') {
                        unzip(bufferHelper.toBuffer(), function(err, buff) {
                            if (!err && buff) {
                                var page_encoding = get_page_encoding(res.headers,buff);
                                page_encoding = page_encoding.toLowerCase().replace('\-','');
                                return callback(null, iconv.decode(buff,page_encoding));
                            }else return callback('no content');
                        })
                    }else if (res_encoding == 'deflate' && typeof inflate != 'undefined') {
                        inflate(bufferHelper.toBuffer(), function(err, buff) {
                            if (!err && buff) {
                                var page_encoding = get_page_encoding(res.headers,buff);
                                page_encoding = page_encoding.toLowerCase().replace('\-','');
                                return callback(null, iconv.decode(buff,page_encoding));
                            }else callback('no content');
                        });
                    }else{
                        var page_encoding = get_page_encoding(res.headers,bufferHelper.toBuffer());
                        page_encoding = page_encoding.toLowerCase().replace('\-','');
                        return callback(null, iconv.decode(bufferHelper.toBuffer(),page_encoding));
                    }
                } else {
                    return callback('http error');
                }
            } catch (e) {
                return callback(e);
            }
        });
    });

    req.on('error', (e) => {
        callback(e);
    });

    req.on('socket', function (socket) {
        socket.setTimeout(20000);  
        socket.on('timeout', function() {
            req.abort();
        });
    });

    req.write(datastr);
    req.end();
}

exports.request = request;
exports.postJsonHttpsRequet = postJsonHttpsRequet;
exports.get = function(url,callback){
    request(url,null,null,null,300,false,(err,status_code,content,page_encoding,param)=>{
        callback(err,content);
    });
}
