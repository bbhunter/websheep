import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provider } from '../../../testing/pact-provider';
import { HttpInterceptorsModule } from '../../http/http-interceptors.module';
import { AppState } from '../../reducers';
import { UserSheepService } from './user-sheep.service';
import { like, iso8601DateTimeWithMillis } from '@pact-foundation/pact/dsl/matchers';

describe('UserSheepService', () => {
  beforeAll(async () => {
    await provider.setup();

    await provider.addInteraction({
      state: 'farmer A has sheep',
      uponReceiving: `a request for farmer A's sheep`,
      withRequest: {
        method: 'GET',
        path: '/farmers/FARMER_A/sheep',
        headers: { Authorization: 'Bearer VALID_TOKEN' }
      },
      willRespondWith: {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: {
          next: null,
          totalCount: 2,
          items: [
            {
              id: like('Mwy2m8LY'),
              createdAt: iso8601DateTimeWithMillis(),
              farmId: 'FARM_ID',
              name: 'Dolly'
            },
            {
              id: like('VxyoabX4'),
              createdAt: iso8601DateTimeWithMillis(),
              farmId: 'FARM_ID',
              name: 'Bruce'
            }
          ]
        }
      }
    });
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpInterceptorsModule.forRoot()],
      providers: [
        provideMockStore<Pick<AppState, 'config' | 'user'>>({
          initialState: {
            config: {
              apiServerUrl: `http://${provider.server.options.host}:${provider.server.options.port}`,
              apiBasePath: '/',
              includeCredentials: false
            },
            user: {
              token: 'VALID_TOKEN',
              tokenId: null,
              userId: 'FARMER_A'
            }
          }
        })
      ]
    });
  });

  let userSheepService: UserSheepService;
  beforeEach(() => (userSheepService = TestBed.inject(UserSheepService)));

  afterEach(() => provider.verify());

  afterAll(() => provider.finalize());

  it(`should retrieve user's sheep`, async () => {
    const response = await userSheepService.getUserSheep().toPromise();

    expect(response.totalCount).toEqual(2);
    expect(response.items).toEqual([
      expect.objectContaining({
        name: 'Dolly'
      }),
      expect.objectContaining({
        name: 'Bruce'
      })
    ]);
  });
});
