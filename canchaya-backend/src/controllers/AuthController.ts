import { Request, Response } from 'express';
import { Usuario } from '../models/Usuario';
import bcrypt from 'bcryptjs'; // <-- Aseguramos el uso de bcryptjs
import jwt from 'jsonwebtoken';

export class AuthController {

  /**
   * Registro de nuevos usuarios
   */
  public static async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, email, password, rol } = req.body;

      // Validar si el email ya existe
      const usuarioExiste = await Usuario.findOne({ where: { email } });
      if (usuarioExiste) {
        res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        return;
      }

      // Encriptar contraseña de manera segura
      const salt = await bcrypt.genSalt(10);
      const passwordEncriptado = await bcrypt.hash(password, salt);

      // Crear usuario en la base de datos
      const nuevoUsuario = await Usuario.create({
        nombre,
        email,
        password: passwordEncriptado,
        rol: rol || 'CLIENTE'
      });

      res.status(201).json({
        mensaje: 'Usuario registrado con éxito',
        usuario: {
          id: (nuevoUsuario as any).id,
          nombre: (nuevoUsuario as any).nombre,
          email: (nuevoUsuario as any).email,
          rol: (nuevoUsuario as any).rol
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error en el servidor durante el registro.' });
    }
  }

  /**
   * Inicio de sesión (Login)
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Buscar al usuario por email
      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario) {
        res.status(400).json({ error: 'Credenciales inválidas (Usuario no encontrado).' });
        return;
      }

      // Comparar contraseñas encriptadas
      const contraseñaCorrecta = await bcrypt.compare(password, (usuario as any).password); if (!contraseñaCorrecta) {
        res.status(400).json({ error: 'Credenciales inválidas (Contraseña incorrecta).' });
        return;
      }

      // Generar Token JWT
      const secretKey = process.env.JWT_SECRET || 'ClaveSecretaSuperSeguraParaAyacucho2026';
      const token = jwt.sign(
        { id: (usuario as any).id, rol: (usuario as any).rol },
        secretKey,
        { expiresIn: '24h' }
      );

      // Responder con el token y datos básicos del usuario
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: (usuario as any).id,
        nombre: (usuario as any).nombre,
        email: (usuario as any).email,
        rol: (usuario as any).rol
      }
    });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error interno en el inicio de sesión.' });
    }
  }
}