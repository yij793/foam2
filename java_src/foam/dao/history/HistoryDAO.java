/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

package foam.dao.history;

import foam.core.FObject;
import foam.core.PropertyInfo;
import foam.dao.MapDAO;
import foam.dao.ProxyDAO;
import foam.nanos.auth.User;

import java.util.Date;
import java.util.Iterator;
import java.util.Map;

public class HistoryDAO
  extends ProxyDAO
{

  /**
   * Returns an array of updated properties
   *
   * @param currentValue current value
   * @param newValue new value
   * @return array of PropertyUpdate objects
   */
  private PropertyUpdate[] getUpdatedProperties(FObject currentValue, FObject newValue) {
    Map diff = currentValue.diff(newValue);
    Iterator i = diff.keySet().iterator();

    int index = 0;
    PropertyUpdate[] updates = new PropertyUpdate[diff.keySet().size()];
    while ( i.hasNext() ) {
      String key = (String) i.next();
      PropertyInfo prop = (PropertyInfo) currentValue.getClassInfo().getAxiomByName(key);

      PropertyUpdate update = new PropertyUpdate()
          .setName(key)
          .setOldValue(prop.f(currentValue))
          .setNewValue(diff.get(key));
      updates[index++] = update;
    }

    return updates;
  }

  @Override
  public FObject put(FObject obj) {
    // TODO: use context-oriented context when available.
    User user = (User) getX().get("user");
    MapDAO historyDAO = (MapDAO) getX().get("historyDAO");
    FObject current = this.find(obj);

    // add new history record
    HistoryRecord historyRecord = new HistoryRecord();
    historyRecord.setUser(user);
    historyRecord.setTimestamp(new Date().getTime());
    historyRecord.setUpdates(getUpdatedProperties(current, obj));
    historyDAO.put(historyRecord);

    return super.put(obj);
  }
}
