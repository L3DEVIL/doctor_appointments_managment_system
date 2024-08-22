const jwt = require('jsonwebtoken');
const crypto = require('crypto');


class Security {
    constructor() {
        this.JWT_SECRET = process.env.JWT_KEY;
        this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Ensure it's in the correct format
        this.ENCRYPTION_IV = Buffer.from(process.env.ENCRYPTION_IV, 'hex'); 
        this.HASH_ALGORITHM = 'sha256'; // Hashing algorithm
        this.HASH_ENCODING = 'hex'; // Encoding format for the hash
        this.HASH_KEY = process.env.HASH_KEY; // Key for HMAC hashing

        this.authenticateToken = this.authenticateToken.bind(this); 
        this.authenticateDoctor = this.authenticateDoctor.bind(this);
        
    }

    generateUniqueString(length = 6) {
        const bytes = crypto.randomBytes(length);
        return 'p' + bytes.toString('hex').slice(0, length);
    }
    

    generateToken(data) {
        return jwt.sign(data, this.JWT_SECRET, { expiresIn: '100m' });
    }
    authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return res.status(401).json({ message: 'Authorization header is missing' });
            }
            const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
            if (!token) {
                return res.status(401).json({ message: 'Token is missing' });
            }
        
        //   const {token} = req.body;
          if (!token) return res.status(401).json({ message: 'Access Denied' });
          const verified = jwt.verify(token, this.JWT_SECRET);
          req.patient = verified
          next();
        } catch (err) {
          res.status(400).json({ message: 'Invalid Token : ' + err });
        }
    }
    authenticateDoctor(req, res, next) {
        try {
          const {token} = req.body;
          if (!token) return res.status(401).json({ message: 'Access Denied' });
          const verified = jwt.verify(token, this.JWT_SECRET);
          if (!verified.doctor_id) return res.status(401).json({ message: 'Access Denied' });
          req.doctor = verified
          next();
        } catch (err) {
          res.status(400).json({ message: 'Invalid Token : ' + err });
        }
    }

    encrypt(text) {
        const cipher = crypto.createCipheriv(this.algorithm, this.ENCRYPTION_KEY, this.ENCRYPTION_IV);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedText) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.ENCRYPTION_KEY, this.ENCRYPTION_IV);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }


    hashData(data) {
        return crypto.createHmac(this.HASH_ALGORITHM, this.HASH_KEY)
                     .update(data)
                     .digest(this.HASH_ENCODING);
    }

}

module.exports = Security;