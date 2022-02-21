const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();
/*
    fs모듈은 이미지를 업로드할 uploads 폴더가 없을 때 uploads 폴더를 생성한다.  
    이렇게 노드를 통해 코드로 생성할 수 있어서 편리하다.
*/
fs.readdir('uploads', (error) => {
    if (error) {
        console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
        fs.mkdirSync('uploads');
    }
});
/*
    Multer 모듈에 옵션을 주어 upload 변수에 대입했다. upload는 미들웨어를 만드는 객체가 된다.
    옵션으로는 storage 속성과 limits 속성을 주었다. storage에는 파일 저장 방식과 경로, 파일명등을  
    설정할 수 있다. diskStorage를 사용해 이미지가 서버 디스크에 저장되도록 했고, diskStorage의
    destination 메서드로 저장 경로를 nodebird 폴더 아래 uploads 폴더로 지정했다. 
    (multer.diskStorage()는 매개변수로 DiskStorageOptions를 받는다. destination함수는 
    multer.diskStorage({  }), 중괄호 내에서만 사용가능하다. {}는 객체이다. DiskStorageOptions 
    인터페이스의 구현 객체이므로 DiskStorageOptions에서 정의한 메서드를 구현해야 한다.)

    파일명은 filename 메서드로 기존 이름(file.originalname)에 업로드 날짜값(new Date().valueOf())과 
    기존 확장자(path.extname)를 붙이도록 설정했다. 업로드 날짜값을 붙이는 이유는 파일명이 중복되는 
    것을 막기 위해서이다. limits 속성은 최대 이미지 파일 용량 허용치(바이트 단위)를 의미한다. 현재 
    10MB로 설정되어 있다.

    upload 변수는 미들웨어를 만드는 여러 가지 메서드를 가지고 있다. 자주 쓰이는 것은 single, array,  
    fields, none이다. single은 하나의 이미지를 업로드할 때 사용하며, req.file 객체를 생성한다.  
    array와 fields는 여러 개의 이미지를 업로드할 때 사용하며, req.files 객체를 생성한다. array와   
    fields 차이점은 이미지를 업로드한 body 속성 개수이다. 속성 하나에 이미지를 여러 개 업로드했다면  
    array를, 여러 개의 속성에 이미지를 하나씩 업로드했다면 fields를 사용한다. none은 이미지를 올리지않고  
    데이터만 multipart 형식으로 전송했을 때 사용한다. NodeBird 앱에서는 single과 none을 사용한다.
*/
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024},
});
/*
    이미지 업로드를 처리하는 라우터이다. 이 라우터에서는 single 미들웨어를 사용하고 있다.
    single 메서드에 이미지가 담긴 req.body 속성의 이름을 적어준다. 현재 NodeBird 앱에서
    AJAX로 이미지를 보낼 때 속성 이름을 img로 하고 있다. 이제 upload.single 미들웨어는
    이 이미지를 처리하고 req.file 객체에 결과를 저장한다. req.file 객체는 다음과 같다.
    { 
        fieldname: 'img',
        originalname: 'nodejs.png',
        encoding: '7bit',
        mimetype: 'image/png',
        destination: 'uploads/',
        filename: 'nodejs87293487293.png',
        path: 'uploads\\nodejs3948203498234.png',
        size: 53357
    }
*/
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file);
    res.json({ url : `/img/${req.file.filename}`});
});
/*
    게시글 업로드를 처리하는 라우터이다. 이미지를 업로드했다면 이미지 주소도 req.body.url로  
    전송된다. 데이터 형식이 multipart이긴 하지만, 이미지 데이터가 들어있지 않으므로 none 메서드로  
    사용했다. 이미지 주소가 온 것이지 이미지 데이터 자체가 온 것이 아니다. 게시글을 데이터베이스에
    저장한 후, 게시글 내용에서 해시태그를 정규표현식으로 추출해낸다. 추출한 해시태그들을 데이터베이스에
    저장한 후, post.addHashtags 메서드로 게시글과 해시태그의 관계를 PostHashtag 테이블에 넣는다.
*/
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            userId: req.user.id,
        });
        console.log("post");
        console.log(post);
        const hashtags = req.body.content.match(/#[^\s]*/g);
        if (hashtags) {
            const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
                where: { title: tag.slice(1).toLowerCase() },
            })));
            console.log("result");
            console.log(result);
            await post.addHashtags(result.map(r => r[0]));
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});
/*
    해시태그로 조회하는 `/post/hashtag` 라우터이다. 쿼리스트링으로 해시태그 이름을 받고 해시태그가  
    빈 문자열인 경우 메인페이지로 돌려보낸다. 데이터베이스에서 해당 해시태그가 존재하는지 검색한 후,  
    있다면 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져온다. 가져올 때는 작성자 정보를  
    JOIN한다. 조회 후 메인 페이지를 렌더링하면서 전체 게시글 대신 조회된 게시글만 twits에 넣어 렌더링한다.  
*/
router.get('/hashtag', async (req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
        return res.redirect('/');
    }
    try {
        const hashtag = await Hashtag.findOne({ where: { title: query } });
        let posts = [];
        if (hashtag) {
            posts = await hashtag.getPosts({ include: [{ model: User }] });
        }
        return res.render('main', {
            title: `${query} | NodeBird`,
            user: req.user,
            twits: posts,
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;