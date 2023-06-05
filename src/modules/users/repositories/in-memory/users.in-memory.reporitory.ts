import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { User } from '../../entities/user.entity';
import { UsersRepository } from '../users.repository';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersInMemoryRepository implements UsersRepository {
  private database = {};
  private databasePath = path.resolve(__dirname, '../../../../../db.json');

  private persist() {
    fs.writeFile(this.databasePath, JSON.stringify(this.database));
  }

  constructor() {
    fs.readFile(this.databasePath, 'utf8')
      .then((data) => {
        this.database = JSON.parse(data);
      })
      .catch(() => {
        this.persist();
      });
  }

  create(data: CreateUserDto): User | Promise<User> {
    const newUser = new User();
    Object.assign(newUser, {
      ...data,
    });
    if (Array.isArray(this.database['users'])) {
      this.database['users'].push(newUser);
    } else {
      this.database['users'] = [newUser];
    }
    this.persist();
    return plainToInstance(User, newUser);
  }

  findByEmail(email: string): User | Promise<User> {
    const user = this.database['users'].find(
      (user: User) => user.email === email,
    );
    return plainToInstance(User, user);
  }

  findAll(): Promise<User[]> | User[] {
    const users: User[] = this.database['users'] || [];
    return plainToInstance(User, users);
  }

  findOne(id: string): User | Promise<User> {
    const user = this.database['users'].find((user: User) => user.id === id);
    return plainToInstance(User, user);
  }

  update(id: string, data: UpdateUserDto): User | Promise<User> {
    const userIndex = this.database['users'].findIndex(
      (user: User) => user.id === id,
    );
    this.database['users'][userIndex] = {
      ...this.database['users'][userIndex],
      ...data,
    };
    this.persist();
    const updatedUser = this.database['users'][userIndex];
    return plainToInstance(User, updatedUser);
  }

  delete(id: string): void | Promise<void> {
    const userIndex = this.database['users'].findIndex(
      (user: User) => user.id === id,
    );
    this.database['users'].splice(userIndex, 1);
    this.persist();
  }
}
