const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

/*
    다른 사용자를 팔로우할 수 있는 /user/:id/follow 라우터이다. :id 부분이 req.params.id가  
    된다. 먼저 팔로우할 사용자를 데이터베이스에서 조회한 후, 시퀄라이즈에서 추가한 addFollowing
    메서드로 현재 로그인한 사용자와의 관계를 지정한다.  
*/
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id } });
        await user.addFollowing(parseInt(req.params.id, 10));
        res.send('success');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;