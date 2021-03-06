/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import * as fromGroups from './store';
import {Observable} from 'rxjs/Observable';
import {LoadAction} from './store/group.actions';
import {of} from 'rxjs/observable/of';
import {GroupService} from '../services/group/group.service';
import {GroupsStore} from './store/index';
import {ExistsGuardService} from '../common/guards/exists-guard';

@Injectable()
export class GroupExistsGuard implements CanActivate {

  constructor(private store: GroupsStore,
              private groupService: GroupService,
              private existsGuardService: ExistsGuardService) {
  }

  hasGroupInStore(id: string): Observable<boolean> {
    const timestamp$: Observable<number> = this.store.select(fromGroups.getGroupLoadedAt)
      .map(loadedAt => loadedAt[id]);

    return this.existsGuardService.isWithinExpiry(timestamp$);
  }

  hasGroupInApi(id: string): Observable<boolean> {
    const getGroup$: Observable<any> = this.groupService.getGroup(id)
      .map(groupEntity => new LoadAction({
        resource: groupEntity
      }))
      .do((action: LoadAction) => this.store.dispatch(action))
      .map(group => !!group);

    return this.existsGuardService.routeTo404OnError(getGroup$);
  }

  hasGroup(id: string): Observable<boolean> {
    return this.hasGroupInStore(id)
      .switchMap(inStore => {
        if (inStore) {
          return of(inStore);
        }
        return this.hasGroupInApi(id);
      });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasGroup(route.params['id']);
  }
}
