import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import {AuthService} from 'src/app/upload-data/GoogleAuth';


@Injectable({
  providedIn: 'root'
})


export class GoogleDriveService {
  private readonly API_ENDPOINT = 'https://www.googleapis.com/auth/drive';
  private readonly UPLOAD_TYPE = 'files';
  private readonly FILE_FIELDS = 'id,webViewLink';
  private AuthService:AuthService;
  constructor(private http: HttpClient) {}

  uploadFileToDrive(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const accessToken = 'ya29.a0AfB_byCCLaTB7GJ_eFH365yapoGnZBsmU5nILqVlhRqqeFvcTghlYN7IT2Hs0k1MQerWf26-Jodp_j_xFIiyq2VutIn4sYli3OEMieEYCyi5P9Ekc1BvQpK0LaahQgQ5TIGmJ-zNGZ2dQSc8i3R5Js1jEf3HQEYFWbqLaCgYKAYMSARMSFQHGX2MiwpDz2d2AEoWxHpDHtQKQvw0171'; // Obtain access token through OAuth or other authentication

      if (!accessToken) {
        reject('Access token not available');
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const metadata = {
        name: file.name,
        mimeType: file.type
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      this.http.post<any>(`${this.API_ENDPOINT}?uploadType=${this.UPLOAD_TYPE}`, formData, { headers })
        .subscribe(
          (response) => {
            resolve(response.webViewLink);
          },
          (error) => {
            console.log(error);
            reject('File upload failed');
            
          }
        );
    });
  }
}
