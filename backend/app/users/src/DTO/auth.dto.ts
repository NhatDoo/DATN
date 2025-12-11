// src/users/dto/auth.dto.ts
import { IsEmail, IsNotEmpty, MinLength, IsOptional , Length , IsBoolean} from "class-validator";


export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsNotEmpty({ message: "Mã xác nhận không được để trống" })
  @Length(6, 6, { message: "Mã xác nhận phải gồm 6 chữ số" })
  code: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  password: string;

  @IsNotEmpty({ message: "Họ tên không được để trống" })
  @MinLength(3, { message: "Họ tên phải có ít nhất 3 ký tự" })
  full_name: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
