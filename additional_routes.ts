const formidable = require('formidable');
const {copyFile, unlink} = require('fs/promises');
import { generateJwtToken } from './jwt-authenticate';

export const handleUploadFile = async (req: any, file: any) => {
  const uploadFolder = 'uploads';

  try {
    // Copy file from temp folder to uploads folder (not rename to allow cross-device link)
    await copyFile(file.path, `./public/${uploadFolder}/${file.name}`);

    // Remove temp file
    await unlink(file.path);

    // Return new path of uploaded file
    file.path = `${req.protocol}://${req.get('host')}/${uploadFolder}/${
      file.name
    }`;

    return file;
  } catch (err) {
    throw err;
  }
};

export const loginHandler = (db: any, req: any, res: any) => {
  const {username, email, password: pwd} = req.body;

  const user = db
  .get('users')
  .find(
    (u: any) =>
      (u.username === username || u.email === email) && u.password === pwd,
  )
  .value();

  if (user && user.password === pwd) {
    const token = generateJwtToken(user.id);
    const {password, ...userWithoutPassword} = user;

    res.jsonp({
      ...userWithoutPassword,
      token,
    });
  } else {
    res.status(400).jsonp({message: 'Username or password is incorrect!'});
  }
}
export const registerHandler = (db: any, req: any, res: any) => {
  const {username, email, password} = req.body;

  if (!password && (!email || !username)) {
    res.status(400).jsonp({message: 'Please input all required fields!'});
    return;
  }

  const existUsername = db
  .get('users')
  .find((user: any) => username && user.username === username)
  .value();

  if (existUsername) {
    res.status(400).jsonp({
      message:
        'The username already exists. Please use a different username!',
    });
    return;
  }

  const existEmail = db
  .get('users')
  .find((user: any) => email && user.email === email)
  .value();

  if (existEmail) {
    res.status(400).jsonp({
      message:
        'The email address is already being used! Please use a different email!',
    });
    return;
  }

  const lastUser = db.get('users').maxBy('id').value();
  const newUserId = parseInt(lastUser.id, 10) + 1;
  const newUser = {id: newUserId, ...req.body};

  db.get('users').push(newUser).write();

  res.jsonp(newUser);
};

export const uploadFileHandler = (req: any, res: any) => {
  if (req.headers['content-type'] === 'application/json') {
    res
    .status(400)
    .jsonp({message: 'Content-Type "application/json" is not allowed.'});
    return;
  }

  const form = formidable();

  form.parse(req, async (error: any, fields: any, files: any) => {
    let file = files.file;

    if (error || !file) {
      res.status(400).jsonp({message: 'Missing "file" field.'});
      return;
    }

    try {
      file = await handleUploadFile(req, file);
      res.jsonp(file);
    } catch (err) {
      console.log(err);
      res.status(500).jsonp({message: 'Cannot upload file.'});
    }
  });
}

export const uploadFilesHandler = (req: any, res: any) => {
  if (req.headers['content-type'] === 'application/json') {
    res
    .status(400)
    .jsonp({message: 'Content-Type "application/json" is not allowed.'});
    return;
  }

  const form = formidable({multiples: true});

  form.parse(req, async (error: any, fields: any, files: any) => {
    let filesUploaded = files.files;

    if (error || !filesUploaded) {
      res.status(400).jsonp({message: 'Missing "files" field.'});
      return;
    }

    // If user upload 1 file, transform data to array
    if (!Array.isArray(filesUploaded)) {
      filesUploaded = [filesUploaded];
    }

    try {
      // Handle all uploaded files
      filesUploaded = await Promise.all(
        filesUploaded.map(async (file: any) => {
          try {
            file = await handleUploadFile(req, file);
            return file;
          } catch (err) {
            throw err;
          }
        }),
      );

      res.jsonp(filesUploaded);
    } catch (err) {
      console.log(err);
      res.status(500).jsonp({message: 'Cannot upload files.'});
    }
  });
};
