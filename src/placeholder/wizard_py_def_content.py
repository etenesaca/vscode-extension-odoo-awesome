# -*- encoding: utf-8 -*-
##############################################################################
#
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

from openerp.osv import fields, osv


class _CLASS_TABLE_(osv.osv_memory):
    _name = '_CLASS_MODEL_'
    _description = '_WIZARD_NAME_'
    _columns = {
        'partner_id': fields.many2one('res.partner', u'Partner', required=True, help=u''),
    }

    def save(self, cr, uid, ids, context=None):
        return True


# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
