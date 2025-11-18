# server.js 설명

## 전체 과정
1. 사용자가 서비스에서 '구글 계정으로 시작' 버튼을 클릭 -> /auth/google 로 라우팅 됨
2. 사용자가 구글 로그인 화면에서 로그인 하면 /auth/google/callback으로 코드가 반환 됨
3. 본 서버는 다시 구글 OAuth 서버로 code에 해당하는 사용자의 토큰과 프로필을 요청
4. 토큰과 프로필을 반환 받으면, 프로필의 이메일 값을 이용하여 서비스 DB에 등록된 사용자기 있는지 조회
5. 등록된 사용자가 존재하는 경우, 커스텀 콜백의 req.login()을 통해 세션스토어(레디스)에 세션 저장 및 세션 쿠키 발급 후 /dashboard로 리다이렉트
6. 등록된 사용자가 존재하지 않는 경우, profile + token 값을 req.session.signupProfile에 저장 후 done(null, false, {resason : 'signup'}) 실행
-> 에러는 없지만, 등록된 사용자도 없다. 이유는 회원기입 해야하기 때문
7. 6번의 done()이 커스텀 콜백의 user, info 객체로 들어가게 되며, user가 없고 info의 이유가 signup 일때 /signup으로 리다이렉트 한다.
8. GET /signup에서는 req.session.signupProfile이 존재하는지 확인 하고, 회원가입 화면을 랜더링 한다.
9. 8번의 회원가입 화면에서 폼을 입력 후 submit을 하면 POST /signup 으로 요청
10. POST /signup 내부에서는 req.body의 값을 통해 DB에 새로운 사용자를 등록하고 req.session.signupProfile을 제거 후 req.login을 통해 세션에 사용자를 등록한다.

## signupProfile을 req.session에 저장하는 이유
- 직렬화 함수를 사용하지 않고 req.session.객체명 을 통해서 redis에 저장 가능하다.
- 현재 로직에서 db에 사용자가 없으면 /signup으로 리다이렉션 해야하는 상황이 발생하는데, 이경우 
  진행중이던 콜백의 req 객체가 휘발 된다.
- 그렇기 때문에 req.session에 직접 signupProfile을 저장해 둠으로써, /signup 리다이렉션으로 인해
  req가 휘발되더라도 verify 콜백이 반환한 profile 객체를 계속 유지할 수 있다.

## Serialize and deserialize
- req.user 는  세션에 저장된 사용자 정보를 복원해서 붙이는 값
- 로그인 시 serialize가 세션에 사용자 정보를 저장
- 다음 요청 시 deserialize가 세션에서 꺼내서 req.user를 다시 주입
- 이 두 함수는 핸들러라고 생각하면 편하다. 세션 저장 시 필요한 과정을 serialize에 정의하고, 
  저장된 세션이 호출 될 때 또 어떤 과정으로 req에 저장할 것인지를 deserialize에 정의한다.