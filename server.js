import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/config/passport.js';
import routes from './src/routes/index.js';
import sessionConfig from './src/config/session.js';
import cors from 'cors';
import { logWithTimestamp, errorWithTimestamp } from './src/utils/logger.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정
app.use(cors({origin:'*', credentials : true}));

// 세션 설정
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

// bodyParser + public
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'src/public')));

// Setting Vie햐ws
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));


// 메인 라우터 연결
app.use('/', routes);

// 404 Handler : Not Found
app.use((req, res) => {
  errorWithTimestamp('❌404: NOT FOUND');
  res.status(404).render('404');
});

// Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logWithTimestamp(`Connected to port ${PORT}`);
});
