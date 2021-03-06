/**
 * @license
 * Copyright 2018 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

package foam.lib.query;

import foam.lib.json.IntParser;
import foam.lib.json.Whitespace;
import foam.lib.parse.Alt;
import foam.lib.parse.Literal;
import foam.lib.parse.PStream;
import foam.lib.parse.ParserContext;
import foam.lib.parse.ProxyParser;
import foam.lib.parse.Seq;

//YYYY-MM-DDTHH:MM
//YYYY-MM-DDTHH
//YYYY-MM-DD
//YYYY-MM
//YYYY
public class LiteralDateParser
  extends ProxyParser
{

  public LiteralDateParser() {
    super(
        new Alt(

            //YYYY-MM-DDTHH:MM
            new Seq(
              IntParser.instance(),
              new Alt(
                Literal.create("-"),
                Literal.create("/")),
              IntParser.instance(),
              new Alt(
                Literal.create("-"),
                Literal.create("/")),
              IntParser.instance(),
              Literal.create("T"),
              IntParser.instance(),
              Literal.create(":"),
              IntParser.instance()),

            //YYYY-MM-DDTHH
            new Seq(
              IntParser.instance(),
              new Alt(
                Literal.create("-"),
                Literal.create("/")),
              IntParser.instance(),
              new Alt(
                Literal.create("-"),
                Literal.create("/")),
              IntParser.instance(),
              Literal.create("T"),
              IntParser.instance()),

        //YYYY-MM-DD
          new Seq(
            //Literal.create("\""),
            IntParser.instance(),
            new Alt(
                Literal.create("-"),
                Literal.create("/")),
            IntParser.instance(),
            new Alt(
                Literal.create("-"),
                Literal.create("/")),
            IntParser.instance(),
            Whitespace.instance()),

        //YYYY-MM
          new Seq(
              IntParser.instance(),
              new Alt(
                  Literal.create("-"),
                  Literal.create("/")),
              IntParser.instance(),
              Whitespace.instance()),

        //YYYY
          new Seq(
              IntParser.instance())
          ));

  }

  public PStream parse(PStream ps, ParserContext x) {
    ps = super.parse( ps, x );
    if ( ps == null ) return ps;

    java.util.Calendar c = new java.util.GregorianCalendar();
    c.clear();

    Object[] result = (Object[]) ps.value();

    c.set(
      result.length >  1 ? (Integer) result[0]     : 0,
      result.length >  3 ? (Integer) result[2] - 1 : 0,
      result.length >  5 ? (Integer) result[4]     : 0,
      result.length >  7 ? (Integer) result[6]     : 0,
      result.length >  9 ? (Integer) result[8]     : 0,
      result.length > 11 ? (Integer) result[10]    : 0);

    return ps.setValue(c.getTime());
  }
}
