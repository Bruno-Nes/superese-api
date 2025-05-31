import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../modules/user/services/user.service';
import { Profile } from '../../../modules/user/entities/profile.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecoveryStatusService } from '../../../modules/user/services/recovery-status.service';
import { FirebaseService } from '../../../modules/firebase/firebase.service';

describe('UserService - createUserFromFirebase', () => {
  let service: UserService;
  let userRepository: Repository<Profile>;
  let recoveryService: RecoveryStatusService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRecoveryService = {
    markRelapse: jest.fn(),
  };

  const mockFirebaseService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockUserRepository,
        },
        {
          provide: RecoveryStatusService,
          useValue: mockRecoveryService,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    recoveryService = module.get<RecoveryStatusService>(RecoveryStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserFromFirebase', () => {
    it('should return existing user if found', async () => {
      // Arrange
      const firebaseUid = 'test-firebase-uid';
      const email = 'test@example.com';
      const existingUser = {
        id: 'existing-id',
        firebaseUid,
        email,
        username: 'ExistingUser',
      } as Profile;

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act
      const result = await service.createUserFromFirebase(firebaseUid, email);

      // Assert
      expect(result).toBe(existingUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { firebaseUid },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async () => {
      // Arrange
      const firebaseUid = 'test-firebase-uid';
      const email = 'test@example.com';
      const displayName = 'TestUser';
      
      const newUser = {
        firebaseUid,
        email,
        username: displayName,
      };

      const savedUser = {
        id: 'new-user-id',
        ...newUser,
      } as Profile;

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockRecoveryService.markRelapse.mockResolvedValue(undefined);

      // Act
      const result = await service.createUserFromFirebase(firebaseUid, email, displayName);

      // Assert
      expect(result).toBe(savedUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { firebaseUid },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        firebaseUid,
        email,
        username: displayName,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
      expect(mockRecoveryService.markRelapse).toHaveBeenCalledWith(firebaseUid);
    });

    it('should generate anonymous username if displayName not provided', async () => {
      // Arrange
      const firebaseUid = 'test-firebase-uid';
      const email = 'test@example.com';
      
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve({ id: 'new-id', ...user }));
      mockRecoveryService.markRelapse.mockResolvedValue(undefined);

      // Spy on gerarUsernameAnonimo method
      const generateUsernameSpy = jest.spyOn(service, 'gerarUsernameAnonimo');
      generateUsernameSpy.mockReturnValue('AstutoLeao123');

      // Act
      const result = await service.createUserFromFirebase(firebaseUid, email);

      // Assert
      expect(generateUsernameSpy).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        firebaseUid,
        email,
        username: 'AstutoLeao123',
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const firebaseUid = 'test-firebase-uid';
      const email = 'test@example.com';
      
      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.createUserFromFirebase(firebaseUid, email)
      ).rejects.toThrow('Failed to create user from Firebase: Database error');
    });
  });

  describe('gerarUsernameAnonimo', () => {
    it('should generate username with correct format', () => {
      // Act
      const username = service.gerarUsernameAnonimo();

      // Assert
      expect(username).toMatch(/^[A-Za-z]+[A-Za-z]+\d{1,3}$/);
      expect(username.length).toBeGreaterThan(5);
      expect(username.length).toBeLessThan(30);
    });

    it('should generate different usernames on subsequent calls', () => {
      // Act
      const username1 = service.gerarUsernameAnonimo();
      const username2 = service.gerarUsernameAnonimo();

      // Assert
      expect(username1).not.toBe(username2);
    });
  });
});
