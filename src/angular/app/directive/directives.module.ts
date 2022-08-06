import { NgModule } from '@angular/core';

import GameNumberDirective from './GameNumberDirective';

@NgModule({
    declarations: [GameNumberDirective],
    exports: [GameNumberDirective]
})
export default class DirectivesModule { }
