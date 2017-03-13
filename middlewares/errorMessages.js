var error = {
    notFound: {
        code: 404,
        msg: "찾을 수 없습니다. 확인해 주세요."
    },
    sError: {
        code: 500,
        msg: "다시 시도해주세요."
    },
    notUse : {
        code : 401,
        msg : "사용하실 수 없습니다."
    },
    notAuth : {
        code : 403,
        msg : "접근 불가능"
    }
}

module.exports = error;