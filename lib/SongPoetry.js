'use strict'

const words = ['空','东风','何处','人间','风流','归去','春风','西风','归来','江南','相思','梅花','千里','回首','明月','多少','如今','阑干','年年','万里','一笑','黄昏','当年','天涯','相逢','芳草','尊前','一枝','风雨','流水','依旧','风吹','风月','多情','故人','当时','无人','斜阳','不知','不见','深处','时节','平生','凄凉','春色','匆匆','功名','一点','无限','今日','天上','杨柳','西湖','桃花','扁舟','消息','憔悴','何事','芙蓉','神仙','一片','桃李','人生','十分','心事','黄花','一声','佳人','长安','东君','断肠','而今','鸳鸯','为谁','十年','去年','少年','海棠','寂寞','无情','不是','时候','肠断','富贵','蓬莱','昨夜','行人','今夜','谁知','不似','江上','悠悠','几度','青山','何时','天气','惟有','一曲','月明','往事'];

var make = function(){
	let paragraph_length = Math.floor(2 + Math.random()*4);
	let poetry = '';
	let used_word = {};
	for(let i=0;i<paragraph_length;i++){
		let sentence_length = Math.floor(2 + Math.random()*2);
		let x=0;
		while(x<sentence_length){
			let w = words[Math.floor(Math.random()*words.length)];
			if(!used_word.hasOwnProperty(w)){
				used_word[w] = true;
				poetry += w;
				x++
			}
		}
		if(i<paragraph_length-1)poetry += '，';
	}
	poetry += '。';
	return poetry;
}

var genCode = function(){
	let paragraph_length = Math.floor(2 + Math.random()*4);
	let poetry = [];
	let used_word = {};
	for(let i=0;i<paragraph_length;i++){
		let sentence_length = Math.floor(2 + Math.random()*2);
		let x=0;
		while(x<sentence_length){
			let w = Math.floor(Math.random()*words.length);
			if(!used_word.hasOwnProperty(w)){
				used_word[w] = true;
				poetry.push(w);
				x++
			}
		}
		if(i<paragraph_length-1)poetry.push('-1');
	}
	return poetry.join('o');
}

var makeByCode = function(code){
	var codeArr = code.split('o');
	var poetry = '';
	for(let i=0;i<codeArr.length;i++){
		var num = parseInt(codeArr[i]);
		if(num<0)poetry+='，';
		else poetry += words[num];
	}
	poetry += '。';
	return poetry;
}

var makeByNum = function(num){
	let num_str = num.toString();
	let poetry = '';
	let sent_count = 0;
	for(let i=0;i<num_str.length;i+=2){
		let tmp_num = num_str[i];
		sent_count++;
		if(i+1 < num_str.length){tmp_num += num_str[i+1];sent_count++;}
		let tmp_num_int = parseInt(tmp_num) || 0;
		poetry += words[tmp_num_int];
		if(i>=num_str.length-2){
			poetry += '。';
		}else {
			if(sent_count>6){
				poetry += '，';
				sent_count = 0;
			}else if(sent_count>4){
				if(Math.floor(Math.random()*1)%2==0)poetry += '，';
				sent_count = 0;
			}
		}

	}
	return poetry;
}

if(module.parent){
	exports.make = make;
	exports.makeByNum = makeByNum;
	exports.genCode = genCode;
	exports.makeByCode = makeByCode;
}else{
	var code = genCode();
	console.log(code);
	console.log(makeByCode(code));
}