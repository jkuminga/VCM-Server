import pool from "../config/db.js";
import { logWithTimestamp, errorWithTimestamp } from "../utils/logger.js";

const LIMIT = 10;

export default {
    // 페이지에 해당하는 프로젝트 목록을 받아오는 로직
    getProjectListsByPageNo : async (req, res)=>{
        const rawPageNo = Number.parseInt(req.params.pageNo, 10);
        const pageNo = Number.isNaN(rawPageNo) || rawPageNo < 1 ? 1 : rawPageNo;
        const offset = (pageNo - 1)* LIMIT;
        // const pageNo = parseInt(req.params.pageNo);

        try{
            const [results] = await pool.query('SELECT id, project_id, registry, total_issued FROM projects LIMIT ? OFFSET ?', [LIMIT, offset]);

            const [[{count}]] = await pool.query('SELECT COUNT(*) as count FROM projects');

            logWithTimestamp(`✅ 프로젝트 ${pageNo} 페이지 목록 불러오기 완료`)


            const pagination = {
                    "current_page": pageNo,
                    "total_pages" : Math.ceil(count / LIMIT),
                    "total_items": count,
                    "limit": LIMIT
                };
            const data = results
                
            // res.status(200).render('projects', {data, pagination, user: req.user})
            res.status(200).json({
                "pagination": {
                    "current_page": pageNo,
                    "total_pages" : Math.ceil(count / LIMIT),
                    "total_items": count,
                    "limit": LIMIT
                },
                "data": results
            })
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 ${pageNo} 페이지 목록 불러오기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트 목록 불러오기 실패",
                "error" : err
            })
        }
    },

    // 프로젝트 세부정보를 받아오는 로직
    getProjectsDetail : async(req, res)=>{
        // 1. params(id) 받아오기
        // 2, id 값으로 해당 컬럼만 들고온 후 반환

        const id = req.params.id;
        
        try{
            const [[detail]] = await pool.query('SELECT id, project_id, project_name, registry, status, scope, type, removal_or_reduction, methodology, country, project_developer, verifier, vintage, estimated_annual_emission_reductions, registry_document FROM projects WHERE id = ?',[id]);

            logWithTimestamp(`✅ 프로젝트(${detail['project_id']}) 세부정보 불러오기 완료`);
            res.status(200).json(detail)
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트(${id}) 세부정보 불러오기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트 세부정보 불러오기 실패",
                "error" : err
            })
        }

    },

    // 프로젝트의 크래딧/프랜잭션 정보를 받아오는 로직
    getProjectTransactionData : async(req, res)=>{
        // 1. id 받아옴
        // 2. id를 이용해서 projects 테이블에서 project_id + credits 관련 아이템 들고옴
        // 3. project_id를 이용해서 List를 들고움

        const id = req.params.id;

        try{
            const [[result]] = await pool.query('SELECT project_id, total_retired, total_issued, issued_2023,issued_2024,issued_2025, retired_2023,retired_2024, retired_2025 FROM projects WHERE id = ?', [id]);

            logWithTimestamp(result);

            const projectId = result['project_id'];

            const [rows] = await pool.query('SELECT * FROM ex_transactions WHERE project_id = ?', [projectId]);

            logWithTimestamp(rows);

            result['total_transactions_count'] = rows.length;
            result['transactions'] = rows;

            logWithTimestamp(`✅ 프로젝트(${projectId}) 크래딧/트랜잭션 데이터 불러오기 완료`);
            res.status(200).json(result);
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 크래딧/트랜잭션 데이터 불러오기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트 크래딧/트랜잭션 데이터 불러오기 실패",
                "error" : err
            })
        }
    },

    // 프로젝트 고급 검색 기능 로직
    searchProject : async (req, res)=>{
        const body = req.body;

        const rawPageNo = Number.parseInt(req.params.pageNo, 10);
        const pageNo = Number.isNaN(rawPageNo) || rawPageNo < 1 ? 1 : rawPageNo;
        const offset = (pageNo - 1) * LIMIT;

        const keyword = body['keyword'] ?? ''; // 전송 된 키워드가 없으면 ''처리
        // 전송된 각각의 데이터가 배열이든 단일값이든 배열로 만들고, 공백값을 삭제 
        const registries = Array.isArray(body['registry']) ? body['registry'] : [body['registry']].filter(Boolean);
        const statuses = Array.isArray(body['status']) ? body['status'] : [body['status']].filter(Boolean);
        const scopes = Array.isArray(body['scope']) ? body['scope'] : [body['scope']].filter(Boolean);

        const conditions = [];// Where 문에 사용될 문장들 목록
        const params = [];    // 각 문장에 들어갈 매개변수 목록

        // 키워드 처리 
        if (keyword.trim()) {
            conditions.push('(project_id LIKE ? OR project_name LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // 각 데이터의 쿼리문 처리
        const buildInClause = (column, values) => {
            if (!values.length) return; // 선택된 옵션이 없으면 쿼리+파라미터 모두 없음
            conditions.push(`${column} IN (${values.map(()=> '?').join(', ')})`);
            // registry IN (?, ? );
            params.push(...values);
            // 
        };

        // 각 요청값에 대한 처리 함수 실행
        buildInClause('registry', registries); 
        buildInClause('status', statuses);
        buildInClause('scope', scopes);

        // 실제 WHERE문 생성
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // logWithTimestamp(whereClause);
        logWithTimestamp(params);

        try{
            const [rows] = await pool.query(`SELECT id, project_id, registry, total_issued FROM projects ${whereClause} LIMIT ${LIMIT} OFFSET ${offset}`,
                params);

            const [[{count}]] = await pool.query(`SELECT COUNT(*) AS count FROM projects ${whereClause}`, params);

            logWithTimestamp(count);
            res.status(200).json({
                'option' : body,
                'pagination' : {
                    "current_page": pageNo,
                    "total_pages" : Math.ceil(count / LIMIT),
                    "total_items": count,
                    "limit": LIMIT  
                },
                'data' : rows
            });
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 고급 검색 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트 고급 검색 실패",
                "error" : err
            })
        }
    },

    // 프로젝트 등록 로직
    addNewProject :  async (req, res)=>{
        const userId = req.user.user_id;

        if(!userId){
            logWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            res.status(401).render('401');
        }

        const body = req.body;

        const projectName = body['project_name'];
        const registry = body['registry_to_register'];
        const scope = body['scope'];
        const type = body['type'] ?? '';
        const status = 'unknown';
        const removalOrReduction = body['removal_or_reduction'] ?? 'undefined';
        const methodology = body['methodology'] ?? '';
        const country = body['country'];
        const projectDeveloper = body['project_developer'] ?? '';
        const estimatedAnnualEmissionReductions = body['estimated_annual_emission_reductions'] ?? 0;

        try{
            // TODO : 현재 발생하는 문제점
            // 새로운 프로젝트 입력 시, project_id는 디폴트 값이 없어서 오류가 생김
            // 해결 방법 : 같은 레지스트리에 있는 projects_id를 다들고와서, 마지막 값에 +1 해야할듯
            // -> 근데 이렇게 해버리면 DB 업데이트 했을 때 임의로 만든 project_id와 겹치면 문제 발생
            // + 현재 세션 사용자 정보를 불러와서 user_id에 넣어야함

            // 새로운 프로젝트 id 생성
            let newId;
            const keyword = '%N'
            // 프로젝트에서 등록되는 프로젝트는 *N 의 이름을 가짐
            const [[row]] = await pool.query('select project_id as lastProjectId FROM projects WHERE registry = ? and project_id LIKE ? order by project_id DESC LIMIT 1;', 
                [registry, keyword]);
            const lastProjectId = row?.lastProjectId ?? null;
            logWithTimestamp('🪪해당 레지스트리의 마지막 프로젝트 아이디: ', lastProjectId);

            if(!lastProjectId){
                newId = `${registry}001N`;
            }else{
                const match = lastProjectId.match(/^(?<prefix>[A-Za-z]+)(?<num>\d+)(?<suffix>[A-Za-z]*)$/);

                if (match) {
                    // prefix와 num으로 나눠서 num + 1 한 후 N 붙이기
                    const { prefix, num, suffix } = match.groups;
                    const next = String(Number(num) + 1).padStart(num.length, '0');
                    newId = `${prefix}${next}${suffix}`; // gs013
                    logWithTimestamp('🪪새 프로젝트 아이디 : ', newId);
                }
            }

            const [_] = await pool.query('INSERT INTO projects (project_id, project_name, registry, status ,scope, type, removal_or_reduction, methodology, country, project_developer, estimated_annual_emission_reductions, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                [newId, projectName, registry, status, scope, type, removalOrReduction, methodology, country, projectDeveloper, estimatedAnnualEmissionReductions,userId]);

            logWithTimestamp('✅ 새로운 프로젝트 등록 완료');
            // res.status(200).render('project-success', {isEdit:true});
            res.status(200).json({
                "code": 200,
                "status": "success",
                "message": "새로운 프로젝트 등록 완료"
            })

        }catch(err){
            errorWithTimestamp(`❌ 새로운 프로젝트 등록 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "새로운 프로젝트 등록 실패 ",
                "error" : err
            })
        }

    }, 

    // 퍼블릭 프로젝트 수정 로직
    editProject : async(req, res)=>{
        // 1. body 받아와서 전처리
        // 2 DB-update
        // 3. 결과 랜더링
        const id = req.params.id;
        const body = req.body;

        const projectName = body['project_name'];
        const registry = body['registry'];
        const scope = body['scope']
        const type = body['type']
        const removalOrReduction = body['removal_or_reduction']
        const methodology = body['methodology']
        const country = body['country']
        const projectDeveloper = body['project_developer']
        const estimatedAnnualEmissionReductions = body['estimated_annual_emission_reductions'];


        try{
            const [_] = await pool.query('UPDATE projects SET project_name = ?, registry = ?, scope = ?, type = ?, removal_or_reduction = ?, methodology = ?,  country = ?, project_developer =? , estimated_annual_emission_reductions=? WHERE id = ?',
                [projectName, registry, scope, type, removalOrReduction, methodology, country, projectDeveloper, estimatedAnnualEmissionReductions,id]);

            logWithTimestamp('✅ 프로젝트 수정 완료')
            res.status(200).json({
                "code": 200,
                "status": "success",
                "message": "프로젝트 수정 완료"
            })
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 수정 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "새로운 프로젝트 등록 실패 ",
                "error" : err
            })
        }
    },

    // ========================================================================
    // 처리 대기중인 프로젝트 관련 API
    // ========================================================================
    addNewUserProject :async(req ,res)=>{
        if(!req.user){
            logWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).json({
                "code" : 401,
                "status" : "Unauthorized",
                "message" : "로그인 된 사용자가 없습니다."
            })
        }

        const data = req.body;

        const userId = req.user.user_id;
        const projectName = data['project_name'];
        const developerName = data['project_developer'];
        const registry = data['registry_to_register'];
        const scope = data['scope'];
        const type = data['type'];
        const country = data['country'];
        const description = data['description'];
        const methodology = data['methodology'];
        const baselineSummary = data['baseline_summary'];
        const monitoringPlan = data['monitoring_plan'];
        const additionality = data['additionality'];
        const removalOrReduction = data['removal_or_reduction']
        const codeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const generatePublicCode = () => Array.from({ length: 8 }, () => codeChars[Math.floor(Math.random() * codeChars.length)]).join('');


        try{
            let publicCode = null;
            const maxAttempts = 5;
            for(let attempt = 0; attempt < maxAttempts; attempt += 1){
                const candidate = generatePublicCode();
                const [[{count}]] = await pool.query('SELECT COUNT(*) as count FROM user_projects WHERE public_code = ?', [candidate]);
                if(count === 0){
                    publicCode = candidate;
                    break;
                }
            }

            if(!publicCode){
                throw new Error('public_code 생성 실패');
            }

            const [result] = await pool.query('INSERT INTO user_projects (user_id, public_code, project_name, developer_name, registry, scope, type, country, description, methodology, baseline_summary, monitoring_plan, additionality, removal_or_reduction) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
                [userId, publicCode, projectName, developerName, registry, scope, type, country, description, methodology, baselineSummary, monitoringPlan,additionality, removalOrReduction])

            logWithTimestamp('✅ 새로운 프로젝트 등록 요청 완료')

            res.status(200).json({
                "code": 200,
                "status": "success",
                "message": "새로운 프로젝트 등록 요청 완료"
            })
            
        }catch(err){
            errorWithTimestamp(`❌ 새로운 프로젝트 등록 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "새로운 프로젝트 등록 요청 실패 ",
                "error" : err
            })
        }
    },

    getUserProjectsList : async(req, res)=>{
        const rawPageNo = Number.parseInt(req.params.pageNo, 10);
        const pageNo = Number.isNaN(rawPageNo) || rawPageNo < 1 ? 1 : rawPageNo;
        const offset = (pageNo - 1)* LIMIT;

        const APPROVED = 'approved';

        const projectId = req.params.projectId;
        
        try{
            const [results] = await pool.query("SELECT u.id, u.project_name, u.country, u.scope, COALESCE(SUM(CASE WHEN r.reaction = 'like' THEN 1 ELSE 0 END), 0) AS like_count, COALESCE(SUM(CASE WHEN r.reaction = 'dislike' THEN 1 ELSE 0 END), 0) AS dislike_count FROM user_projects AS u LEFT JOIN user_project_reactions AS r ON u.id = r.project_id WHERE u.status = ? GROUP BY u.id, u.project_name, u.country, u.scope ORDER BY u.id DESC LIMIT ? OFFSET ?", [APPROVED,LIMIT, offset]);

            const [[{count}]] = await pool.query('SELECT COUNT(*) as count FROM user_projects WHERE status = ?', [APPROVED]);

            logWithTimestamp(`✅ 대기중인 프로젝트 ${pageNo} 페이지 목록 불러오기 완료`)
 
            const pagination = {
                    "current_page": pageNo,
                    "total_pages" : Math.ceil(count / LIMIT),
                    "total_items": count,
                    "limit": LIMIT
                };
            const data = results
                
            res.status(200).json({
                "pagination": {
                    "current_page": pageNo,
                    "total_pages" : Math.ceil(count / LIMIT),
                    "total_items": count,
                    "limit": LIMIT
                },
                "data": results
            })
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 수정 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "새로운 프로젝트 등록 실패 ",
                "error" : err
            })
        }

    },

    getUserProjectDetail :async (req, res)=>{
        // 사용자 프로제그 세부정보 반환
        // router.get('/waiting/detail/:projectId', (req, res)=>{
        //     projectsController.getUserProjectDetail(req, res)
        // })
        const projectId = req.params.projectId;


        try{
            const [[detail]] = await pool.query('SELECT * FROM user_projects WHERE id = ?', [projectId]);

            const [[counts]] = await pool.query("SELECT COALESCE(SUM(CASE WHEN reaction = 'like' THEN 1 ELSE 0 END), 0) AS like_count, COALESCE(SUM(CASE WHEN reaction = 'dislike' THEN 1 ELSE 0 END), 0) AS dislike_count FROM user_project_reactions WHERE project_id = ?", [projectId]);

            detail['like_count'] = parseInt(counts['like_count']);
            detail['dislike_count'] = parseInt(counts['dislike_count']);

            logWithTimestamp('✅대기 중인 프로젝트 세부 정보 불러오기 완료')

            res.status(200).json(detail);
        }catch(err){
            errorWithTimestamp(`❌ 대기 중인 프로젝트 세부 정보 불러오기 완료`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "대기 중인 프로젝트 세부 정보 불러오기 완료 ",
                "error" : err
            })
        }

    },

    editUserProjectDetail :async (req, res)=>{
        if(!req.user){
            logWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).json({
                code : 401,
                status : 'Unauthorized'
            })
        }

        const projectId = req.params.projectId;
        const data = req.body;

        const projectName = data['project_name'] //nn
        const projectDeveloper = data['project_developer'];//nn
        const registry = data['registry']; //nn
        const scope = data['scope']; //nn
        const type = data['type'];     
        const country = data['country']; // nn
        const description = data['description']; 
        const methodology = data['methodology'];
        const baselineSummary = data['baseline_summary'];
        const monitoringPlan = data['monitoring_plan'];
        const additionality = data['additionality'];
        const removalOrReduction = data['removal_or_reduction'];

        const requiredFields = [
            projectName,
            projectDeveloper,
            registry,
            scope,
            country
        ];

        if(requiredFields.some((field) => !field || !String(field).trim())){
            return res.status(400).json({
                code: 400,
                status: "Bad Request",
                message: "필수 항목이 비어있습니다."
            })
        }

        try{
            await pool.query('UPDATE user_projects SET project_name = ?, registry = ?, scope=?, type=?, removal_or_reduction =?, methodology =?, country =?, developer_name =?, description =? ,baseline_summary=?, monitoring_plan =? , additionality=? WHERE id= ? ',
                [projectName,registry, scope, type, removalOrReduction, methodology,country, projectDeveloper,description,baselineSummary, monitoringPlan,additionality,projectId]
            )

            logWithTimestamp('✅ 프로젝트 수정 완료')
            res.status(200).json({
                result : 'done'
            })            
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 수정 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트 수정 실패 ",
                "error" : err
            })
        }
    },

    // 싱글 프로젝트에 달았던 리액션 보기
    getReaction : async (req, res)=>{
        // 1. 로그인 상태 확인하고 만약 로그인이 안되있으면 204
        // 2. userId = req.user.user_id , pjid = req.params
        // 3. select reaction from project
        // 4. if no data -> 200 null
        // 5. else -> reaction

        if(!req.user){
            logWithTimestamp('⚙️로그인 상태가 아닙니다.')
            return res.status(200).json({
                reaction : null
            })
        }

        const userId = req.user.user_id;
        const projectId = req.params.projectId;

        try{
            const [rows] = await pool.query('SELECT reaction FROM user_project_reactions WHERE user_id = ? AND project_id = ?', [userId, projectId]);
            if(rows.length === 0 ){
                logWithTimestamp('⚙️해당 프로젝트에 등록된 리액션 없음');
                return res.status(200).json({
                    reaction : null
                })
            }
            const reaction = rows[0]['reaction'];

            logWithTimestamp(`✅ 프로젝트 id ${projectId}의 리액션 가져오기 완료`);
            return res.status(200).json({
                reaction : reaction
            })
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트 id ${projectId}의 리액션 가져오기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트의 리액션 가져오기 완료",
                "error" : err
            })
        }
    },

    // 싱글 프로젝트에 리엑션 달기
    postReaction : async (req, res)=>{
        const userId = req.user.user_id;
        const projectId = req.params.projectId;
        const data = req.body;
        const reaction = data['reaction'];

        // 로그인 상태가 아닌 경우
        if(!req.user){
            errorWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).json({
                "code" : 401,
                "status" : "Unauthorized",
                "message" : "로그인 된 사용자가 없습니다."
            })
        }

        // 전송한 Reaction !== like || !== dislike
        if (!['like', 'dislike'].includes(reaction)) {
            errorWithTimestamp('❌ 잘못된 리액션 전송');
            return res.status(400).json({ message: 'Invalid reaction' });
        }

        try{
            const [rows] = await pool.query('SELECT reaction from user_project_reactions WHERE user_id = ?', [userId])

            if(rows.length === 0){
                await pool.query('INSERT INTO user_project_reactions (user_id, project_id, reaction) VALUES (?,?,?)', [userId, projectId, reaction])
                logWithTimestamp(`✅ 새로운 리액션 등록 : {사용자 : ${userId}, 프로젝트ID : ${projectId}}`)
                return res.status(200).json({result : 'done'})
            }else{
                const currentReaction = rows[0]['reaction'];
                console.log(currentReaction);
                if(currentReaction === reaction){
                    await pool.query('DELETE FROM user_project_reactions WHERE user_id =? AND project_id = ?', [userId, projectId]);
                    logWithTimestamp('✅ 기존의 리액션 삭제');
                    return res.status(200).json({result : 'done'})
                }else{
                    await pool.query('UPDATE user_project_reactions SET reaction = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND project_id = ?',
                        [reaction, userId, projectId]
                    )
                    logWithTimestamp(`✅ 리액션 변경 : ${currentReaction} -> ${reaction}`);
                    return res.status(200).json({result : 'done'})
                }
            }
        }catch(err){
            errorWithTimestamp(`❌ 새로운 리액션 달기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "새로운 리액션 달기 성공",
                "error" : err
            })
        }
    },

    // 새로운 코멘트 작성
    postComment : async(req, res)=>{
        if(!req.user){
            errorWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).json({
                code : 401,
                status : 'Unauthorized'
            })
        }

        const data = req.body;
        const userId = req.user.user_id;
        const projectId = req.params.projectId;
        console.log('prjectId', projectId);

        if(data['content'] === ""){
            errorWithTimestamp('❌ 입력된 내용이 없습니다.');
            res.status(400).json({
                code: 400,
                status : "Bad Request"
            })
        }

        try{
            await pool.query('INSERT INTO user_project_comments (project_id, user_id, content) VALUES (?,?,?)', [projectId, userId, data['content']])

            logWithTimestamp(`✅프로젝트 ${projectId}에 댓글 달기 완료`);
            res.status(200).json({
                code : 200,
                status : 'OK',
                message : `프로젝트 ${projectId}에 댓글 달기 완료`
            })
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트에 댓글 달기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트에 댓글 달기 실패 ",
                "error" : err
            })
        }
    },

    // 코멘트 목록 불러오기
    getComments : async (req ,res)=>{
        const projectId = req.params.projectId;

        try{
            const [rows] = await pool.query('SELECT c.id, c.content, u.email FROM user_project_comments c JOIN user u ON c.user_id = u.user_id WHERE c.project_id = ?', [projectId]);

            logWithTimestamp('✅ 프로젝트에 등록된 댓글 목록 불러오기 완료')
            res.status(200).json(rows)
        }catch(err){
            errorWithTimestamp(`❌ 프로젝트에 등록된 댓글 목록 불러오기 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "프로젝트에 등록된 댓글 목록 불러오기 실패 ",
                "error" : err
            })
        }

    },

    // 싱글 코멘트 삭제하기
    deleteComments : async (req, res)=>{
        const commentId = req.params.commentId;
        try{
            await pool.query('DELETE FROM user_project_comments WHERE id = ?', [commentId]);

            logWithTimestamp('✅ 댓글 삭제 완료')
            res.status(200).json({
                result : 'done',
            })
        }catch(err){
            errorWithTimestamp(`❌ 댓글 삭제 실패`, err);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "댓글 삭제 실패",
                "error" : err
            })
        }

    }

};
